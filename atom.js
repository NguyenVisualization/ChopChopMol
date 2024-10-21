import * as THREE from 'three'

export default function getAtom(symbol, radius, color, x, y, z){
    const atomGeo=new THREE.IcosahedronGeometry(radius, 12)
    const atomMat=new THREE.MeshPhongMaterial({color: color, shininess: 200})
    const atomMesh=new THREE.Mesh()
    atomMesh.position.set(x, y, z)
    return atomMesh
}