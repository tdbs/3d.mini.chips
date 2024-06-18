import os
import json


def generate_json():
    textures = {}
    for root, dirs, files in os.walk("textures"):
        if root == "textures":
            continue
        folder = root.split("/")[-1]
        denoms = {}
        for file in files:
            if not file.endswith(".png"):
                continue
            denom = file[:4]
            if denom not in denoms:
                denoms[denom] = []
            denoms[denom].append(file)

        textures[folder] = [sorted(denoms[d]) for d in sorted(denoms)]

    sorted_textures = {k: textures[k] for k in sorted(textures)}

    with open("textures.json", "w") as f:
        json.dump(sorted_textures, f, indent=4)


if __name__ == "__main__":
    generate_json()
