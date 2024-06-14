import os
import json


def generate_json():
    textures = {}
    for root, dirs, files in os.walk("textures"):
        if root == "textures":
            continue
        key = root.split("/")[-1]
        textures[key] = sorted([file for file in files if file.endswith(".png")])

    sorted_textures = {k: textures[k] for k in sorted(textures)}

    with open("textures.json", "w") as f:
        json.dump(sorted_textures, f, indent=4)


if __name__ == "__main__":
    generate_json()
