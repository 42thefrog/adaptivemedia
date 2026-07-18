# Johnson Look Mechanics

Johnson looks around through a shallow swivel of the circular face plate, supported by a restrained pitch or yaw of the rigid box body. The four feet and lower leg endpoints remain anchored; the thin arms hang naturally and lag by only a few pixels. The three dark apertures move with the face plate as one physical module rather than sliding independently or becoming replacement eyes.

Motion budget: every 22.5-degree step changes face-plate position and body angle by an even amount. Cardinal cues must be deliberately stronger than the first attempt while body scale, baseline, leg spacing, face proportions, and arm attachment points remain stable. No whole-sprite rotation, affine tilt, or elastic body warp.

- 000 up: front plane pitches clearly upward; face plate sits in the upper third, apertures cluster toward its upper rim, and almost no top plane is visible.
- 090 screen-right: face plate center sits clearly right of body center; left side plane is visible while the right plane is compressed; apertures bias toward the screen-right rim.
- 180 down: front plane pitches clearly downward; a broad top plane is visible, face plate sits in the lower third, and apertures cluster toward its lower rim.
- 270 screen-left: face plate center sits clearly left of body center; right side plane is visible while the left plane is compressed; apertures bias toward the screen-left rim.

Diagonal poses interpolate these families continuously. Arms follow the torso with gentle cable-like lag while claws remain attached and feet do not slide.
