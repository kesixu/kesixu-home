"""Render a short synthetic tissue loop for the PathBot visual demo.

The scene is intentionally abstract. It contains no patient data and must not be
presented as a microscopy image or model output.
"""

import math
import os
import random
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
FRAME_DIR = ROOT / "workspace" / "tissue-loop-frames"
FRAME_DIR.mkdir(parents=True, exist_ok=True)
MEDIA_DIR = ROOT / "site" / "pathbot" / "visual-demo" / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

random.seed(20260906)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def hex_color(value):
    value = value.lstrip("#")
    rgb = tuple(int(value[i : i + 2], 16) / 255 for i in (0, 2, 4))
    return (*rgb, 1.0)


def material(name, color, metallic=0.0, roughness=0.45, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = hex_color(color)
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = hex_color(color)
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    if emission:
        principled.inputs["Emission Color"].default_value = hex_color(color)
        principled.inputs["Emission Strength"].default_value = emission
    return mat


def look_at(obj, target=(0.0, 0.0, 0.0)):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_ellipsoid(name, location, scale, mat, rotation=None):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    if rotation:
        obj.rotation_euler = rotation
    obj.data.materials.append(mat)
    return obj


def add_curve(name, points, bevel, mat):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = bevel
    curve.bevel_resolution = 3
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def configure_render():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.08
    scene.cycles.use_light_tree = True
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = 96
    scene.render.filepath = str(FRAME_DIR / "frame_")
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -1.15

    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.0015, 0.003, 0.004, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.03

    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "CUDA"
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == "CUDA"


def build_scene():
    clear_scene()
    configure_render()

    tissue = material("Tissue", "#120c11", roughness=0.78)
    stroma = material("Stroma", "#17603d", roughness=0.46, emission=0.06)
    tumor = material("Neoplastic", "#7a2037", roughness=0.44, emission=0.07)
    immune = material("Inflammatory", "#263760", roughness=0.42, emission=0.08)
    epithelial = material("Epithelial", "#78401f", roughness=0.48, emission=0.05)
    dim = material("Other", "#30282d", roughness=0.68)
    nucleus = material("Nuclei", "#563675", roughness=0.38, emission=0.05)
    scan = material("Scan", "#1bce71", roughness=0.25, emission=1.6)

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, -1.15))
    slab = bpy.context.object
    slab.name = "Abstract tissue field"
    slab.scale = (6.2, 3.7, 0.35)
    slab.data.materials.append(tissue)
    bevel = slab.modifiers.new("Soft tissue edge", "BEVEL")
    bevel.width = 0.38
    bevel.segments = 6

    palettes = [
        (tumor, 0.31),
        (stroma, 0.32),
        (immune, 0.18),
        (epithelial, 0.12),
        (dim, 0.07),
    ]
    cells = []
    for index in range(94):
        pick = random.random()
        total = 0.0
        cell_mat = dim
        for candidate, weight in palettes:
            total += weight
            if pick <= total:
                cell_mat = candidate
                break
        x = random.uniform(-5.45, 5.45)
        y = random.uniform(-3.0, 3.0)
        z = random.uniform(-0.67, -0.35)
        radius = random.uniform(0.16, 0.34)
        cell = add_ellipsoid(
            f"Cell {index:03d}",
            (x, y, z),
            (radius * random.uniform(1.15, 1.8), radius, radius * random.uniform(0.25, 0.48)),
            cell_mat,
            (random.uniform(-0.15, 0.15), random.uniform(-0.15, 0.15), random.uniform(0, math.tau)),
        )
        cells.append(cell)
        if index % 3 != 0:
            add_ellipsoid(
                f"Nucleus {index:03d}",
                (x, y, z + radius * 0.18),
                (radius * 0.47, radius * 0.38, radius * 0.24),
                nucleus,
            )

    targets = [(-2.2, -1.2), (1.8, -1.0), (2.4, 1.5), (-1.8, 1.7)]
    highlighted = []
    for target_x, target_y in targets:
        choices = [cell for cell in cells if cell not in highlighted]
        highlighted.append(min(choices, key=lambda obj: (obj.location.x - target_x) ** 2 + (obj.location.y - target_y) ** 2))
    evidence_points = []
    for index, cell in enumerate(highlighted):
        loc = cell.location.copy()
        loc.z += 0.42
        bpy.ops.mesh.primitive_torus_add(
            major_radius=max(cell.scale.x, cell.scale.y) * 0.92,
            minor_radius=0.014,
            major_segments=32,
            minor_segments=6,
            location=loc,
        )
        ring = bpy.context.object
        ring.name = f"Evidence ring {index:02d}"
        ring.data.materials.append(scan)
        evidence_points.append((loc.x, loc.y, loc.z + 0.05))

    evidence_points.sort(key=lambda point: point[0])
    add_curve("Auditable evidence trail", evidence_points, 0.010, scan)

    bpy.ops.mesh.primitive_cube_add(location=(-5.4, 0, 0.18))
    scan_line = bpy.context.object
    scan_line.name = "Triage scan"
    scan_line.scale = (0.012, 3.1, 0.012)
    scan_line.data.materials.append(scan)
    scan_line.keyframe_insert(data_path="location", frame=1)
    scan_line.location.x = 5.4
    scan_line.keyframe_insert(data_path="location", frame=96)

    bpy.ops.object.light_add(type="AREA", location=(-1.5, -2.5, 5.5))
    key = bpy.context.object
    key.name = "Softbox"
    key.data.energy = 190
    key.data.shape = "DISK"
    key.data.size = 5.5
    key.data.color = (0.62, 0.70, 0.88)
    look_at(key)

    bpy.ops.object.light_add(type="AREA", location=(4.5, 2.5, 2.4))
    rim = bpy.context.object
    rim.name = "Evidence rim"
    rim.data.energy = 115
    rim.data.size = 3.0
    rim.data.color = (0.08, 1.0, 0.45)
    look_at(rim)

    bpy.ops.object.camera_add(location=(0, -11.2, 6.3))
    camera = bpy.context.object
    camera.name = "PathBot camera"
    camera.data.lens = 56
    camera.data.dof.use_dof = True
    camera.data.dof.focus_object = highlighted[0]
    camera.data.dof.aperture_fstop = 5.6
    bpy.context.scene.camera = camera
    look_at(camera, (0, 0, -0.55))
    camera.keyframe_insert(data_path="location", frame=1)
    camera.location = (0.55, -10.4, 5.85)
    look_at(camera, (0.15, 0.0, -0.55))
    camera.keyframe_insert(data_path="location", frame=48)
    camera.location = (0, -11.2, 6.3)
    look_at(camera, (0, 0, -0.55))
    camera.keyframe_insert(data_path="location", frame=97)

    bpy.context.scene.frame_set(1)
    blend_path = ROOT / "workspace" / "pathbot-tissue-loop.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    print("SCENE_READY", blend_path)


build_scene()
if os.environ.get("PATHBOT_FRAME_ONLY"):
    bpy.context.scene.render.filepath = str(FRAME_DIR / "preview.png")
    bpy.ops.render.render(write_still=True)
    print("PREVIEW_COMPLETE", FRAME_DIR / "preview.png")
else:
    bpy.ops.render.render(animation=True)
    print("RENDER_COMPLETE", FRAME_DIR)
