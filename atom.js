import * as THREE from 'three'

let atomOptions

fetch('options.json')
  .then(response => response.json())  // Parse the JSON file
  .then(data => {
    atomOptions=data;  // Use the data here
    console.log(data)
  })
  .catch(error => {
    console.error('Error loading the JSON file:', error);
});

export default function getAtom(symbol, radius, color, x, y, z){
    const atomGeo=new THREE.IcosahedronGeometry(radius, 12)
    const atomMat=new THREE.MeshPhongMaterial({color: color, shininess: 200})
    const atomMesh=new THREE.Mesh(atomGeo, atomMat)
    atomMesh.position.set(x, y, z)
    return atomMesh
}

