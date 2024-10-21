import * as THREE from 'three';
import {OrbitControls} from 'jsm/controls/OrbitControls.js'

let positionsX=[]
let positionsY=[]
let positionsZ=[]

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0,0,10)
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

const lights=new THREE.DirectionalLight(0xffffff, 1)
const ambiLights=new THREE.AmbientLight(0xffffff, 0.5)
scene.add(lights)
scene.add(ambiLights)


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
            console.log(atomVisuals)
            createBond()

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
    // console.log(atomicData)
    
}

function addToVisualizer(allAtomsSymbols, atomicData){
    for(let i=0; i<allAtomsSymbols.length; i++){
        const mySymbol=atomicData[i].atomicSymbol
        let colorH
        console.log(mySymbol)
        let radius
        switch(mySymbol[0]) {
            case 'O':
                colorH='red'
                radius=2
                break;
            case 'H':
                colorH='lightgray'
                radius=1
                break
            case 'C':
                colorH='gray'
                radius=2.5
                break;
            default:
                colorH='green'
        }

        const atomMat = new THREE.MeshPhongMaterial({color: colorH, shininess: 200}); // Atom material
        const atomGeo = new THREE.IcosahedronGeometry(radius, 10); // Atom geometry

        const atomMesh = new THREE.Mesh(atomGeo, atomMat); // Create mesh from geometry and material
        
        // Set atom position using atomicData (uncomment this to use the coordinates from the data)
        atomMesh.position.x = atomicData[i].coordinates.x * 4;
        atomMesh.position.y = atomicData[i].coordinates.y * 4;
        atomMesh.position.z = atomicData[i].coordinates.z * 4;
        
        // Add atom to the scene
        scene.add(atomMesh);
        
        // Store in the atomVisuals array (optional, for further use)
        atomVisuals.push(atomMesh);
    }
    
    console.log(scene);
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

    console.log(atomicData);
}

function getAtomPositions(atomicData){

    for(let i=0; i<atomicData.length; i++){
        positionsX.push(atomicData[i].coordinates.x)
        positionsY.push(atomicData[i].coordinates.y)
        positionsZ.push(atomicData[i].coordinates.z)
    }
    console.log(positionsX)
}


function createBond(){
    getAtomPositions(atomicData)
    let currentAtomNum=0
    let myPositionX
    let myPositionY
    let myPositionZ
    
    let points=[]

    let otherPositionX
    let otherPositionY
    let otherPositionZ
    let distance
    let checks=0
    const bondThreshold=1.5

    for(let i=0;i<atomVisuals.length;i++){
        points=[]
        myPositionX=positionsX[currentAtomNum]
        myPositionY=positionsY[currentAtomNum]
        myPositionZ=positionsZ[currentAtomNum]
        for(let j=0;j<atomVisuals.length;j++){
            if(j!==currentAtomNum){
                checks++
                otherPositionX=positionsX[j]
                otherPositionY=positionsY[j]
                otherPositionZ=positionsZ[j]
                distance=Math.hypot((myPositionX-otherPositionX),(myPositionY-otherPositionY),(myPositionZ-otherPositionZ))
                if(distance<bondThreshold){
                    points.push(new THREE.Vector3(myPositionX*4, myPositionY*4, myPositionZ*4))
                    points.push(new THREE.Vector3(otherPositionX*4, otherPositionY*4, otherPositionZ*4))
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 10 });
                    const line = new THREE.Line(geometry, material);
                    scene.add(line);
                }
            }
        }
        currentAtomNum++
    }
    console.log(checks)

}


window.addEventListener('keydown', function(e){
    if(e.key==' '){
        clearScene()
    }
})

animate()

