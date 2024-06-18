document.addEventListener('DOMContentLoaded', function () {
    let currentChips = [];
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
    let scene;
    let shadowGenerator;

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
        const chipHeight = 4.3;
        const texture_path = 'textures/';
        const spacing = 10 + chipDiameter;
        const top_edge = 4.3 / (27 + 4.3);
        const left_face = 7.70575 / 84.823;
        const right_face = (7.70575 + 27) / 84.823;

        if (textureSet && Object.keys(textureSet).length > 0) {
            max_alts = 0;
            chipMaterials = []
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
                    chipMaterials.push(chipMaterial);

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

                chip.material = chipMaterials[Math.floor(Math.random() * chipMaterials.length)];
                chip.position.z = spacing + max_alts * spacing;
                chip.position.y = chipHeight / 2 + i * chipHeight;
                chip.rotation.y = Math.random() * (2 * Math.PI);
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
            Object.keys(data).forEach(folder => {
                const button = document.createElement('button');
                button.innerText = folder;
                buttonContainer.appendChild(button);

                button.addEventListener('click', () => {
                    const textureSet = data[folder] || [];
                    createChips(folder, textureSet);
                });
            });

            if (Object.keys(data).length > 0) {
                const initialFolder = Object.keys(data)[0];
                const textureSet = data[initialFolder] || [];
                createChips(initialFolder, textureSet);
            }
        })
        .catch(error => console.error('Error fetching textures:', error));
});
