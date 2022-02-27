# <center>Vinci.js</center>

<center><img src="media://crack.png" alt="drawing" width="300"/></center>

Vinci is a 2D displacement discontinuity boundary element method based on [Crouch and Starfield, 1983, Boundary element methods in solid mechanics](https://onlinelibrary.wiley.com/doi/abs/10.1002/nme.1620191014).
 
The code, written in [TypeScript](https://www.typescriptlang.org/), is extremely simple to read, understand and is very short.
It allows easy extensions if necessary such as
- crack propagation
- half-space
- heterogeneous friction and cohesion
- material heterogeneity
- ...

## Documentation
Read [online](https://youwol.github.io/vinci/dist/docs/index.html).

## Minimal example

```ts
import { Fault, Segment, Model, BC, Solution } from '@youwol/vinci'

const fault = new Fault([0,0, 1,1]) // one segment from (0,0) to (1,1)
fault.burgers = [0,1] // imposed displacement

const model = new Model()
model.addFault(fault)

// Post process
const sol = new Solution(model)
const stresses = sol.stress( new Array(100).fill(0).map( _ => Math.random()*3) ) )
```
<br><br>
<center><img src="media://joint.png" alt="drawing" width="300"/></center>
<center><h3>Plotted Sxy</h3></center>
