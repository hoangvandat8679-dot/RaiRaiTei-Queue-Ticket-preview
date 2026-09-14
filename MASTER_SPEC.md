# MASTER_SPEC.md

# RaiRaiTei Queue Ticket — Master Specification

## Single Source of Truth
This file defines non-negotiable project constraints. If an older prompt, screenshot note, code comment, agent suggestion, or previous specification conflicts with this file, this file wins unless the Project Owner explicitly changes it.

## Master Ticket Canvas
- Exact master size: **723 × 1240 px**
- Orientation: portrait only
- Width : Height = **723 : 1240**
- Aspect ratio must remain exactly proportional at every rendered/exported scale.
- Do not crop the ticket.
- Do not stretch or distort the ticket.
- Do not silently substitute A4, Letter, 1:1, 2:3, 3:4, 4:5, or another canvas ratio.
- Screenshot/background areas outside the actual ticket are not part of the ticket canvas.

## Locked Functional Structure
The approved master reference controls the functional placement and hierarchy of:
- Rairaitei logo / approved mascot area
- waiting-number frame and number
- customer message/instruction area
- branch/store name
- essential functional ticket information

Seasonal/template decoration may change only when the task permits it. Decoration must not displace, obscure, crop, distort, or reduce the usability of locked functional areas.

## Branding
- Preserve approved Rairaitei identity and recognizable brand hierarchy.
- Do not redraw, replace, distort, recolor, or reinterpret approved logo/mascot assets unless the Project Owner explicitly requests it.
- Decorative graphics must remain subordinate to functional ticket information.

## Rendering
The same logical ticket must remain consistent across:
- desktop browser
- iPhone/mobile Safari
- Android/Chrome-class mobile browser
- print preview
- printed/exported output

Responsive UI surrounding the ticket may adapt to the viewport. The master ticket itself must preserve its exact 723:1240 geometry.

## Print — Critical
Printing is a release-critical feature.
A change fails QA if it introduces, among other critical failures:
- unexpected second/blank page
- clipping/cropping
- stretched ticket
- wrong orientation
- incorrect ticket scale caused by layout regression
- missing ticket content
- content positioned outside the intended ticket

Print-specific CSS/JS must be tested after any relevant rendering/layout change.

## Mobile — Critical
At minimum, relevant changes must consider narrow mobile viewports representative of iPhone and Android devices. The surrounding application must remain usable without breaking ticket geometry.

## Functional Priority
When requirements conflict, use this priority unless the Project Owner explicitly says otherwise:
1. Core function
2. Correct ticket geometry
3. Print reliability
4. Mobile/browser usability
5. Consistency
6. Branding integrity
7. Decoration

## Change Control
Agents must not change this specification as part of an implementation task. A Master Spec change requires explicit Project Owner approval and Leader review.