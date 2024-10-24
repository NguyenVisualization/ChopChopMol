import * as THREE from 'three';
import {OrbitControls} from 'jsm/controls/OrbitControls.js'
import getAtom from './atom.js';

import {FontLoader} from 'jsm/loaders/FontLoader.js'
import {TextGeometry} from 'jsm/geometries/TextGeometry.js'



let positionsX=[]
let positionsY=[]
let positionsZ=[]

let atomOptions
let labelTrue=false
const w=window.innerWidth
const h=window.innerHeight
let scalar=0.6
const scalarSlider=document.getElementById('scalar')
scalarSlider.value=0.6
scalarSlider.addEventListener('change', function(e){
    scalar=scalarSlider.value
    updateAtomSizes()
})

const clickSound=new Audio()
clickSound.src='click.mp3'

const labelButton=document.getElementById('label')
labelButton.addEventListener('click', function(){
    clickSound.play()
    if(labelButton.textContent=='Show Labels'){
        labelButton.textContent='Hide Labels'
        labelTrue=true
    }else{
        labelButton.textContent='Show Labels'
        labelTrue=false
    }
    updateAtomSizes()

})


const loader = new FontLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(10, w/h, 0.1, 10000)
camera.position.set(80,80,80)
camera.lookAt(0,0,0)
const renderer = new THREE.WebGLRenderer({ antialias: true });
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping=true
controls.enablePan=false
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

let allAtomsSymbols = [];
let atomicData = []; // Declare atomicData globally so it can be accessed

let atomVisuals=[]

const lights=new THREE.DirectionalLight(0xffffff, 4)
const ambiLights=new THREE.AmbientLight(0xffffff, 2)
scene.add(lights)
scene.add(ambiLights)

fetch('options.json')
  .then(response => response.json())  // Parse the JSON file
  .then(data => {
    atomOptions=data;  // Use the data here
    console.log(data)
  })
  .catch(error => {
    console.error('Error loading the JSON file:', error);
});

// Listen for file selection
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            atomicData = extractAtomicData(data); // Save extracted atomic data globally
            getAllAtoms(atomicData); // Call function to get all atom symbols after data is extracted
            console.log(allAtomsSymbols); // Log all atom symbols to the console
            addToVisualizer(allAtomsSymbols, atomicData)
            console.log(atomicData)
            createBond(atomicData)

        };  
        reader.readAsText(file);
    }
});

// Function to extract atomic data
function extractAtomicData(input) {
    const lines = input.trim().split('\n');
    const atomicData = [];

    // Start extracting from the third line onwards
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(/^([A-Z][a-z]*)\s+([-0-9.]+)\s+([-0-9.]+)\s+([-0-9.]+)$/);
        if (match) {
            const atomicSymbol = match[1];
            const coordinates = {
                x: parseFloat(match[2]),
                y: parseFloat(match[3]),
                z: parseFloat(match[4]),
            };
            atomicData.push({ atomicSymbol, coordinates });
        }
    }

    return atomicData;
}

// Function to get all atom symbols
function getAllAtoms(atomicData) {
    const atomCounts = {};

    for (const atom of atomicData) {
        const { atomicSymbol } = atom;

        if (!atomCounts[atomicSymbol]) {
            atomCounts[atomicSymbol] = 0;
        }

        atomCounts[atomicSymbol]++;

        allAtomsSymbols.push(`${atomicSymbol}${atomCounts[atomicSymbol]}`);
    }

    return allAtomsSymbols;
}

// Function to evaluate a specific atom
function evaluateAtoms(atomicData, atomIdentifier) {
    let targetAtom = null;

    // Track counts for each atom type
    const atomCounts = {};

    // Iterate through atomic data to build counts
    for (const atom of atomicData) {
        const { atomicSymbol } = atom;

        // Initialize count if not present
        if (!atomCounts[atomicSymbol]) {
            atomCounts[atomicSymbol] = 0;
        }

        // Increment count for the atomic symbol
        atomCounts[atomicSymbol]++;

        // Check if the current atom matches the user input
        if (atomIdentifier === `${atomicSymbol}${atomCounts[atomicSymbol]}`) {
            targetAtom = atom; // Match the specific atom
            break; // Exit loop
        }
    }

    if (targetAtom) {
        const coordinates = targetAtom.coordinates;
        return coordinates;
    }
}

function animate(){
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
    controls.update()
    // textMesh.lookAt(camera.position)

    for (const atomGroup of atomVisuals) {
        for (const child of atomGroup.children) {
            if (child.userData.isText) {
                child.lookAt(camera.position);
            }
        }
    }

    // console.log(atomicData)
    
}



function addToVisualizer(allAtomsSymbols, atomicData){
    centerMolecule(atomicData);

    for(let i=0; i<allAtomsSymbols.length; i++){
        const mySymbol =(atomicData[i].atomicSymbol).replace(/[^a-zA-Z]/g, '');
        let colorH;
        let radius;

        colorH = atomOptions[mySymbol].color;
        radius = atomOptions[mySymbol].radius * scalar; // Apply updated scalar

        let atomMat

        const atomGroup=new THREE.Group()
        if(labelTrue){
            atomMat = new THREE.MeshPhysicalMaterial({color: colorH, metalness:0.9, roughness:0.1, transparent: true, opacity: 0.8});
        }else{
            atomMat = new THREE.MeshPhysicalMaterial({color: colorH, metalness:0.9, roughness:0.1});
        }
        const atomGeo = new THREE.IcosahedronGeometry(radius, 10);

        const atomMesh = new THREE.Mesh(atomGeo, atomMat);

        // Set atom position using atomicData
        atomMesh.position.x = atomicData[i].coordinates.x * 4;
        atomMesh.position.y = atomicData[i].coordinates.y * 4;
        atomMesh.position.z = atomicData[i].coordinates.z * 4;
        atomMesh.renderOrder=0

        // Add atom to the scene
        atomGroup.add(atomMesh);

        if(labelTrue){
            loader.load('Poppins-Bold.json', function (font) {
                const textGeometry = new TextGeometry(mySymbol, {
                    font: font,
                    size: 0.5,
                    height: 0.2,          
                });
            
                // Create a material for the text
                const textMaterial = new THREE.MeshBasicMaterial({color: 0xffffff,});
                
                // Create a mesh from the geometry and material
                
                // Position the text
                // textMesh.position.set(0, 0, 0);
                
            
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.userData.isText=true
                textMesh.position.set(atomMesh.position.x, atomMesh.position.y, atomMesh.position.z)
                // Add the text mesh to the scene
                textGeometry.center()
                textMesh.renderOrder=999
    
                atomGroup.add(textMesh);
                
            });
        }

        scene.add(atomGroup)
        atomVisuals.push(atomGroup); // Store the updated atom
    }
}


function clearScene() {
    // Traverse through all children in the scene
    while (scene.children.length > 0) {
        const object = scene.children[0]; // Get the first object
        if (object.isMesh) {
            // If the object is a mesh, dispose its geometry and material
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                // If there are multiple materials, dispose each
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
        // Remove the object from the scene
        scene.remove(object);
    }

    // Clear arrays holding atom visuals and symbols
    atomVisuals = [];
    allAtomsSymbols = [];

}

function updateAtomSizes() {
    // Remove the existing atoms from the scene
    atomVisuals.forEach(atom => {
        scene.remove(atom); // Remove each atom from the scene
        if (atom.geometry) atom.geometry.dispose(); // Dispose geometry
        if (atom.material) atom.material.dispose(); // Dispose material
    });
    atomVisuals = []; // Clear the array

    // Re-add the atoms to the scene with the updated scalar
    addToVisualizer(allAtomsSymbols, atomicData);
}


function getAtomPositions(atomicData){

    for(let i=0; i<atomicData.length; i++){
        positionsX.push(atomicData[i].coordinates.x)
        positionsY.push(atomicData[i].coordinates.y)
        positionsZ.push(atomicData[i].coordinates.z)
    }
    console.log(positionsX)
}


function createBond(atomicData){
    getAtomPositions(atomicData)
    let currentAtomNum=0
    let myPositionX
    let myPositionY
    let myPositionZ
    let myAtomSymbol
    let myAtomRadius
    
    let points=[]

    let otherPositionX
    let otherPositionY
    let otherPositionZ
    let otherAtomSymbol
    let otherAtomRadius

    let variables={}

    let distance
    let checks=0
    const bondThreshold=2

    for(let i=0;i<atomVisuals.length;i++){
        points=[]
        myPositionX=positionsX[currentAtomNum]
        myPositionY=positionsY[currentAtomNum]
        myPositionZ=positionsZ[currentAtomNum]
        myAtomSymbol=atomicData[currentAtomNum].atomicSymbol
        myAtomRadius=atomOptions[myAtomSymbol].realRadius
        for(let j=0;j<atomVisuals.length;j++){
            if(j!==currentAtomNum){
                checks++
                otherPositionX=positionsX[j]
                otherPositionY=positionsY[j]
                otherPositionZ=positionsZ[j]
                otherAtomSymbol=atomicData[j].atomicSymbol
                otherAtomRadius=atomOptions[otherAtomSymbol].realRadius




                distance=Math.hypot((myPositionX-otherPositionX),(myPositionY-otherPositionY),(myPositionZ-otherPositionZ))
                if(distance<=(myAtomRadius*4)+(otherAtomRadius*4)){
                    points.push(new THREE.Vector3(myPositionX*4, myPositionY*4, myPositionZ*4))
                    points.push(new THREE.Vector3(otherPositionX*4, otherPositionY*4, otherPositionZ*4))
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({ color: 0x999999});
                    const line = new THREE.Line(geometry, material);
                    scene.add(line);
                }
            }
        }
        currentAtomNum++
    }
    console.log(checks)

}

function centerMolecule(atomicData) {
    let totalX = 0, totalY = 0, totalZ = 0;

    // Calculate the centroid
    atomicData.forEach(atom => {
        totalX += atom.coordinates.x;
        totalY += atom.coordinates.y;
        totalZ += atom.coordinates.z;
    });

    const centerX = totalX / atomicData.length;
    const centerY = totalY / atomicData.length;
    const centerZ = totalZ / atomicData.length;

    // Adjust atom positions to center the molecule at (0, 0, 0)
    atomicData.forEach(atom => {
        atom.coordinates.x -= centerX;
        atom.coordinates.y -= centerY;
        atom.coordinates.z -= centerZ;
    });
}


window.addEventListener('keydown', function(e){
    if(e.key==' '){
        clearScene()
    }
})

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


animate()

