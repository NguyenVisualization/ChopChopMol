import * as THREE from 'three';
import {OrbitControls} from 'jsm/controls/OrbitControls.js'
import getAtom from './atom.js';

import {FontLoader} from 'jsm/loaders/FontLoader.js'
import {TextGeometry} from 'jsm/geometries/TextGeometry.js'



let positionsX=[]
let positionsY=[]
let positionsZ=[]
let bondVisuals = [];  // Array to store bond lines


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

const rect = renderer.domElement.getBoundingClientRect();


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
            loadNewMolecule(atomicData)

        };  
        reader.readAsText(file);
    }
});

function loadNewMolecule(atomicData){
    getAllAtoms(atomicData); // Call function to get all atom symbols after data is extracted
    console.log(allAtomsSymbols); // Log all atom symbols to the console
    addToVisualizer(allAtomsSymbols, atomicData)
    console.log(atomicData)
    createBond(atomicData)
}

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



const atomGroup=new THREE.Group()


function addToVisualizer(allAtomsSymbols, atomicData){
    centerMolecule(atomicData);

    for(let i=0; i<allAtomsSymbols.length; i++){
        const mySymbol =(atomicData[i].atomicSymbol).replace(/[^a-zA-Z]/g, '');
        let colorH;
        let radius;

        colorH = atomOptions[mySymbol].color;
        radius = atomOptions[mySymbol].radius * scalar; // Apply updated scalar

        let atomMat


        atomMat = new THREE.MeshPhysicalMaterial({color: colorH, 
            // metalness:0.9, 
            // roughness:0.1
            // emissive: 0x00ff00
        });
        const atomGeo = new THREE.IcosahedronGeometry(radius, 5);

        const atomMesh = new THREE.Mesh(atomGeo, atomMat);

        // Set atom position using atomicData
        atomMesh.position.x = atomicData[i].coordinates.x * 4;
        atomMesh.position.y = atomicData[i].coordinates.y * 4;
        atomMesh.position.z = atomicData[i].coordinates.z * 4;
        atomMesh.renderOrder=0

        // Add atom to the scene
        if(!labelTrue){
            atomGroup.add(atomMesh);
        }


        if(labelTrue){
            loader.load('Poppins-Bold.json', function (font) {
                const textGeometry = new TextGeometry(mySymbol, {
                    font: font,
                    size: radius,
                    height: 0.2,
                             
                });
            
                // Create a material for the text
                const textMaterial = new THREE.MeshBasicMaterial({color: colorH,});
                
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

    clearBonds()
    // Remove everything except lights
    for (let i = scene.children.length - 1; i >= 0; i--) {
        const object = scene.children[i];
        if (object !== lights && object !== ambiLights) { // Keep the lights
            if (object.isMesh) {
                object.geometry.dispose();
                object.material.dispose();
            }
            scene.remove(object);
        }
    }

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
                    bondVisuals.push(line)
                }
            }
        }
        currentAtomNum++
    }
    console.log(checks)

}

function clearBonds() {
    bondVisuals.forEach(bond => {
        scene.remove(bond);  // Remove the bond from the scene
        bond.geometry.dispose();  // Dispose geometry
        bond.material.dispose();  // Dispose material
    });
    bondVisuals = [];  // Clear the bond array
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

let selecting=false

window.addEventListener('keydown', function(e){
    if(e.key==' '){
        clearScene()
    }
    if(e.key=='Control'){
        selecting=true
    }
})

window.addEventListener('keyup', function(e){
    if(e.key=='Control'){
        selecting=false
    }
})

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const selectionBox = document.createElement('div');
selectionBox.id = 'selectionBox';
document.body.appendChild(selectionBox);

let isSelecting = false;
let startX, startY;
let select={
    startX:0,
    startY:0,
    endX:0,
    endY:0
}

window.addEventListener('mousedown', (event) => {
    if(selecting){
        isSelecting = true;
        startX = event.clientX;
        startY = event.clientY;

        select.startX=((startX - rect.left) / rect.width) * 2 - 1;
        select.startY=-((startY - rect.top) / rect.height) * 2 + 1;

    
        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block'; // Show the box
    }
});

window.addEventListener('mousemove', (event) => {
    if (!isSelecting) return;

    const currentX = event.clientX;
    const currentY = event.clientY;

    const width = currentX - startX;
    const height = currentY - startY;

    select.endX=((currentX - rect.left) / rect.width) * 2 - 1;
    select.endY=-((currentY - rect.top) / rect.height) * 2 + 1;


    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;
    selectionBox.style.left = `${width < 0 ? currentX : startX}px`;
    selectionBox.style.top = `${height < 0 ? currentY : startY}px`;
});

window.addEventListener('mouseup', () => {
    if (!isSelecting) return;
    
    isSelecting = false;
    selectionBox.style.display = 'none'; // Hide the box

    const boxBounds = selectionBox.getBoundingClientRect();
    // selectAtomsInBox(boxBounds);
    selectAtoms()
});

function selectAtomsInBox(bounds) {
    // Here you can implement the logic to check which atoms fall within the selection box
    const atoms = atomVisuals; // Use your atom visuals array
    atoms.forEach(atomGroup => {
        const atomMesh = atomGroup.children[0]; // Assuming the first child is the mesh

        const atomPosition = atomMesh.position.clone().project(camera);
        // Convert from normalized device coordinates to screen coordinates
        const x = (atomPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (atomPosition.y * -0.5 + 0.5) * window.innerHeight;

        if (x > bounds.left && x < bounds.right && y > bounds.top && y < bounds.bottom) {
            // Atom is within the selection box
            atomMesh.material.color.set(0xff0000); // Change color or do something with the selection
        }
    });
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

function selectAtoms() {
    // Convert selection box from NDC to screen coordinates
    const selectStartX = (select.startX * 0.5 + 0.5) * window.innerWidth;
    const selectEndX = (select.endX * 0.5 + 0.5) * window.innerWidth;
    const selectStartY = (-select.startY * 0.5 + 0.5) * window.innerHeight;
    const selectEndY = (-select.endY * 0.5 + 0.5) * window.innerHeight;

    for (let i = 0; i < atomicData.length; i++) {
        // Get the projected position of the atom
        const atomPosition = new THREE.Vector3(positionsX[i], positionsY[i], positionsZ[i]);
        const projectedPosition = atomPosition.project(camera);

        // Convert normalized device coordinates to screen coordinates
        const x = (projectedPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-projectedPosition.y * 0.5 + 0.5) * window.innerHeight;

        // Debug logs for checking the selection box and projected coordinates
        console.log(`Projected Position: (${x}, ${y}) for atom ${i}`);
        console.log(`Selection box: (${selectStartX}, ${selectStartY}) to (${selectEndX}, ${selectEndY})`);

        // Check if the atom's screen position is within the selection box
        if (
            x >= selectStartX && x <= selectEndX &&
            y >= selectStartY && y <= selectEndY
        ) {
            const atomMesh = atomVisuals[i].children[0]; // Assuming the first child is the atom mesh
            atomMesh.material.color.set(0x00ff00); // Change color or do something with the selection
            console.log(`Selected atom ${i}`); // Log selected atoms
        }
    }
}






animate()

