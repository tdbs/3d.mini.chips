document.addEventListener('DOMContentLoaded', function () {
    let currentChips = [];
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
    let scene;
    let shadowGenerator;
    let selections = new Map();
    let sort_mode = 0;

    function createScene() {
        scene = new BABYLON.Scene(engine);

        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3.5, 400, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        // Prevent camera from going below the floor
        camera.lowerRadiusLimit = 100;
        camera.lowerBetaLimit = 0;
        camera.upperBetaLimit = Math.PI / 2; // Prevent flipping upside down

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0));
        light.intensity = 0.7;

        var spotlight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0, 500, -500), new BABYLON.Vector3(0, -1, 1), Math.PI / 3, 2, scene);

        var shadowGenerator = new BABYLON.ShadowGenerator(1024, spotlight);
        shadowGenerator.usePoissonSampling = true;

        const woodTexture = new BABYLON.Texture("textures/wood.png", scene);
        const tableMaterial = new BABYLON.StandardMaterial("tableMaterial", scene);
        woodTexture.uScale = 2; // Tiling on the U axis
        woodTexture.vScale = 4; // Tiling on the V axis
        tableMaterial.diffuseTexture = woodTexture;
        tableMaterial.specularPower = 1000;


        // tableMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // Black color reduces reflectivity
        const table = BABYLON.MeshBuilder.CreateBox("table", { width: 1600, height: 30, depth: 800 }, scene);
        table.position.y = -15;
        table.material = tableMaterial;
        table.receiveShadows = true;

        // Create the credit card
        const cardWidth = 85.60; // Standard credit card width in mm
        const cardHeight = 53.98; // Standard credit card height in mm
        const cardThickness = 1; // Standard credit card thickness in mm
        var card = BABYLON.MeshBuilder.CreateBox("card", {
            width: cardHeight,
            height: cardThickness,
            depth: cardWidth,
            faceUV: [
                new BABYLON.Vector4(0, 0, 0, 0),
                new BABYLON.Vector4(0, 0, 0, 0),
                new BABYLON.Vector4(0, 0, 0, 0),
                new BABYLON.Vector4(0, 0, 0, 0),
                new BABYLON.Vector4(0, 0, 1, 1),
                new BABYLON.Vector4(0, 0, 0, 0),
            ],
        }, scene);
        card.position = new BABYLON.Vector3(-50, cardThickness / 2, -75); // Position it on top of the table
        card.rotation.y = (.4 * Math.PI);
        // Create a material for the credit card
        var cardMaterial = new BABYLON.StandardMaterial("cardMaterial", scene);
        cardMaterial.diffuseTexture = new BABYLON.Texture("textures/cc.png"); // Replace with your texture URL
        card.material = cardMaterial;

        const top_edge_ic = 3.4 / (39 + 3.4);
        const left_face_ic = 11.13053 / 122.522;
        const right_face_ic = (11.13053 + 39) / 122.522;


        const iron_clay_Material = new BABYLON.StandardMaterial("material", scene);
        iron_clay_Material.diffuseTexture = new BABYLON.Texture("textures/ic.png");
        iron_clay_Material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        const iron_clay_chip = BABYLON.MeshBuilder.CreateCylinder("iron_clay_chip", {
            diameter: 39,
            height: 3.4,
            tessellation: 96,
            faceUV: [
                new BABYLON.Vector4(right_face_ic, top_edge_ic, left_face_ic, 1),
                new BABYLON.Vector4(0, 0, 1, top_edge_ic),
                new BABYLON.Vector4(left_face_ic, top_edge_ic, right_face_ic, 1),
            ],
        }, scene);

        iron_clay_chip.material = iron_clay_Material;
        iron_clay_chip.position.x = 50;
        iron_clay_chip.position.z = -75;
        iron_clay_chip.position.y = 3.4 / 2;
        iron_clay_chip.rotation.y = (.5 * Math.PI);
        shadowGenerator.addShadowCaster(iron_clay_chip);



        // Add the credit card to the shadow generator's render list
        shadowGenerator.addShadowCaster(card);

        scene.clearColor = new BABYLON.Color3(0.95, 0.9, 0.85); // Dirty off-white

        return scene, shadowGenerator;
    }

    function createChips(set, textureSet) {
        // Remove existing chips
        currentChips.forEach(chip => chip.dispose());
        currentChips = [];

        const chipDiameter = 27;
        const chipHeight = 4.15;
        const chipPerimeter = chipDiameter * Math.PI;
        const ninety_degrees_length = chipDiameter * 90 / 360 * Math.PI;
        const space_to_face = ninety_degrees_length - chipDiameter/2;
        const texture_path = 'textures/';
        const spacing = 10 + chipDiameter;
        // percentages (0-1) for UV mapping
        const top_edge = chipHeight / (chipDiameter + chipHeight);
        const left_face = space_to_face / chipPerimeter;
        const right_face = (space_to_face + chipDiameter) / chipPerimeter;

        let selectedTextures = new Map(Array.from(document.querySelectorAll('input[type=checkbox]'))
            .filter(checkbox => checkbox.checked)
            .map(checkbox => [checkbox.value, true]));

        filteredTextureSet = []
        Object.keys(textureSet).forEach(index => {
            filteredDenom = []
            textureSet[index].forEach(texture => {
                if (selectedTextures.has(texture)) {
                    filteredDenom.push(texture);
                }
            });
            if (filteredDenom.length > 0) {
                filteredTextureSet.push(filteredDenom);
            }
        });
        textureSet = filteredTextureSet;

        if (textureSet && Object.keys(textureSet).length > 0) {
            max_alts = 0;
            chipMaterials = [];
            x = -spacing / 2 * (Object.keys(textureSet).length - 1);
            z = 0;
            Object.values(textureSet).forEach(denom => {
                if (denom.length > max_alts) {
                    max_alts = denom.length;
                }
                Object.values(denom).forEach(texture => {
                    const chipMaterial = new BABYLON.StandardMaterial("material", scene);
                    chipMaterial.diffuseTexture = new BABYLON.Texture(texture_path + set + '/' + texture);
                    chipMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                    chipMaterials.push([chipMaterial, textureValue(texture)]);

                    for (let i = 0; i < 10; i++) {
                        const chip = BABYLON.MeshBuilder.CreateCylinder("chip" + i, {
                            diameter: chipDiameter,
                            height: chipHeight,
                            tessellation: 96,
                            faceUV: [
                                new BABYLON.Vector4(right_face, top_edge, left_face, 1),
                                new BABYLON.Vector4(0, 0, 1, top_edge),
                                new BABYLON.Vector4(left_face, top_edge, right_face, 1),
                            ],
                        }, scene);

                        chip.material = chipMaterial;
                        chip.position.x = x;
                        chip.position.z = z;
                        chip.position.y = chipHeight / 2 + i * chipHeight;
                        chip.rotation.y = Math.random() * (2 * Math.PI);
                        shadowGenerator.addShadowCaster(chip);

                        currentChips.push(chip);
                    }
                    z += spacing
                });
                z = 0;
                x += spacing
            });

            // dirty stack
            dirts = [];
            for (let i = 0; i < 20; i++) {
                material = chipMaterials[Math.floor(Math.random() * chipMaterials.length)];
                dirts.push(material);
            };
            // sort my mode
            if (sort_mode != 0) {
                dirts.sort(function (a, b) {
                    if (sort_mode == 1) {
                        return a[1] - b[1];
                    } else {
                        return b[1] - a[1];
                    }
                });
            }
            for (let i = 0; i < 20; i++) {
                const chip = BABYLON.MeshBuilder.CreateCylinder("chip" + i, {
                    diameter: chipDiameter,
                    height: chipHeight,
                    tessellation: 96,
                    faceUV: [
                        new BABYLON.Vector4(right_face, top_edge, left_face, 1),
                        new BABYLON.Vector4(0, 0, 1, top_edge),
                        new BABYLON.Vector4(left_face, top_edge, right_face, 1),
                    ],
                }, scene);

                chip.material = dirts[i][0];
                chip.position.z = spacing + max_alts * spacing;
                chip.position.y = chipHeight / 2 + i * chipHeight;
                chip.rotation.y = Math.random() * (2 * Math.PI);
                chip.isPickable = true;
                chip.actionManager = new BABYLON.ActionManager(scene);
                chip.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function (evt) {
                    sort_mode = (sort_mode + 1) % 3;
                    createChips(set, textureSet);
                }));

                shadowGenerator.addShadowCaster(chip);

                currentChips.push(chip);
            }

        }
    }

    scene, shadowGenerator = createScene();
    engine.runRenderLoop(() => {
        scene.render();
    });

    window.addEventListener('resize', () => {
        engine.resize();
    });

    fetch('textures.json')
        .then(response => response.json())
        .then(data => {
            const buttonContainer = document.getElementById('buttonContainer');
            const checkboxContainer = document.getElementById('checkboxContainer');

            Object.keys(data).forEach(folder => {
                const button = document.createElement('button');
                button.innerText = folder;
                buttonContainer.appendChild(button);
                selections.set(folder, new Map());

                Object.values(data[folder]).forEach(denom => {
                    Object.values(denom).forEach(texture => {
                        selections.get(folder).set(texture, true); // All textures selected by default
                    });
                });

                button.addEventListener('click', () => {
                    const textureSet = data[folder] || [];
                    checkboxContainer.innerHTML = '';

                    Object.values(textureSet).forEach(denom => {
                        Object.values(denom).forEach(texture => {
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.value = texture;
                            checkbox.id = texture;
                            checkbox.checked = selections.get(folder).get(texture);
                            checkboxContainer.appendChild(checkbox);

                            const label = document.createElement('label');
                            label.htmlFor = texture;
                            label.innerText = texture.replace('.png', '').replace(/^0+/, '');
                            checkboxContainer.appendChild(label);

                            checkbox.addEventListener('change', () => {
                                selections.get(folder).set(texture, checkbox.checked);
                                createChips(folder, textureSet);
                            });

                            const br = document.createElement('br');
                            checkboxContainer.appendChild(br); // To display checkboxes vertically
                        });
                    });

                    createChips(folder, textureSet);
                });
            });

            if (Object.keys(data).length > 0) {            
                document.querySelector('button').click();
            }
        })
        .catch(error => console.error('Error fetching textures:', error));
});

function textureValue(str) {
    return parseInt(str.replace('.png', '').replace(/^0+/, ''));
}