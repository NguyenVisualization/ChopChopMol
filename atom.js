import * as THREE from 'three'

let atomOptions


export default function getAtom(symbol, radius, color, x, y, z){
    const atomGeo=new THREE.IcosahedronGeometry(radius, 12)
    const atomMat=new THREE.MeshPhongMaterial({color: color, shininess: 200})
    const atomMesh=new THREE.Mesh(atomGeo, atomMat)
    atomMesh.position.set(x, y, z)
    return atomMesh
}

