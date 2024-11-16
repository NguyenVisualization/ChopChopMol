import * as THREE from 'three';
import {OrbitControls} from 'jsm/controls/OrbitControls.js'
import getAtom from './atom.js';

import {FontLoader} from 'jsm/loaders/FontLoader.js'
import {TextGeometry} from 'jsm/geometries/TextGeometry.js'

let atoms


let workingRowArray=[1]
let workRow=2
let positionsX=[]
let positionsY=[]
let positionsZ=[]
let bondVisuals = [];  // Array to store bond lines

let fragColors=[
    '#a8ff8b',
    '#ffa3ff',
    '#ff8b8b',
    '#ffc38b',
    '#fffd8b',
    '#a8ff8b',
    '#8bb3ff',
    '#bc8bff',
    '#cf8bff',
    '#c44848'
]
let atomsNumberArray=[]

let cuboidBox
let atomOptions
let labelTrue=false
const w=window.innerWidth
const h=window.innerHeight
let scalar=0.5
const scalarSlider=document.getElementById('scalar')
scalarSlider.value=0.5
scalarSlider.addEventListener('input', function(){
    updateAtomSizes()

})
scalarSlider.addEventListener('input', function(){

    scalar=scalarSlider.value

    scalarSpan.textContent=`Atom Size: ${scalar}`
})

let mouseOnButton=false

const scalarSpan=document.getElementById('scalarValue')
scalarSpan.textContent=`Atom Size: ${scalar}`

const clickSound=new Audio()
clickSound.src='click.mp3'

const fileSelectButton=document.getElementsByClassName('file-label')[0]
const cuboidBoxGeo=new THREE.BoxGeometry(1,1,1)
const cuboidBoxMaterial=new THREE.MeshStandardMaterial({
    color: "yellow",
    transparent:true,
    opacity: 0.5,
    side: THREE.DoubleSide
})
const cuboid=new THREE.Mesh(cuboidBoxGeo, cuboidBoxMaterial)
cuboid.userData.randomID=38120

const dimensionSelect=document.getElementById('selectBoxDimensions')
dimensionSelect.style.display='none'

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
    for(let i=0; i<atomicData.length;i++){
        updateAtomSizes(i, 1)
    }
})


let fileName
const pointSelectButton = document.getElementById('enableSelection');

pointSelectButton.addEventListener('click', function() {
    const glowEffect = '0 0 20px rgba(255, 255, 255, 0.8)';
    pointSelectButton.classList.toggle('glow')
    pointSelectButton.classList.toggle('bright')
    if(selecting){
        selecting=false
    }else{
        selecting=true
    }

});

let displayMode=false

const displayButton=document.getElementById('displayMode')
displayButton.addEventListener('click', function(){
    if(displayMode){
        displayMode=false
    }else{
        displayMode=true
    }
    updateAtomSizes()

})

let selectBoxWidth;
let selectBoxHeight;
let selectBoxDepth;

let widthSpan = document.getElementById('xSliderValue');
let heightSpan = document.getElementById('ySliderValue');
let depthSpan = document.getElementById('zSliderValue');
const xSlider = document.getElementById('Xslide');
const ySlider = document.getElementById('Yslide');
const zSlider = document.getElementById('Zslide');

xSlider.addEventListener('input', function(e) {
    selectBoxWidth = parseFloat(e.target.value);
    widthSpan.innerHTML = `Width: ${selectBoxWidth}`;
    cuboid.scale.x=selectBoxWidth

});

ySlider.addEventListener('input', function(e) {
    selectBoxHeight = parseFloat(e.target.value);
    heightSpan.innerHTML = `Height: ${selectBoxHeight}`;
    cuboid.scale.y=selectBoxHeight

});

zSlider.addEventListener('input', function(e) {
    selectBoxDepth = parseFloat(e.target.value);
    depthSpan.innerHTML = `Depth: ${selectBoxDepth}`;
    cuboid.scale.z=selectBoxDepth
});



const selectFileButton=document.getElementById('createFile')
selectFileButton.addEventListener('click', function(){
    if(selectedAtoms.length>0){
        createCustomFile()
    }else{
        // Store the original color
        const originalColor = fileSelectButton.style.backgroundColor;

        // Set the button to red
        fileSelectButton.style.backgroundColor = 'red';  
        
        // Start the blinking effect
        let isRed = true; // Track the current color state
        const blinkInterval = setInterval(() => {
            fileSelectButton.style.backgroundColor = isRed ? originalColor : 'red';
            isRed = !isRed; // Toggle the state
        }, 200); // Change color every 500ms

        // Stop blinking after a certain duration (e.g., 3 seconds)
        setTimeout(() => {
            clearInterval(blinkInterval);
            fileSelectButton.style.backgroundColor = originalColor; // Reset to original color
        }, 3000); // Blink for 3 seconds

        window.alert('Please select an atom or load one')
    }

})



let inMainMenu=false



const cameraButton=document.getElementById('camera')
cameraButton.addEventListener('click', function(){
    saveImage()
})

let fragSelected=[]

const loader = new FontLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(10, w/h, 0.1, 10000)
camera.position.set(80,80,80)
camera.lookAt(0,0,0)
const renderer = new THREE.WebGLRenderer({ antialias: true });
const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping=true
controls.enablePan=true
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setPixelRatio(devicePixelRatio);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));  // Limit pixel ratio for performance

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

const docName=document.getElementById('name')
const fSB=document.getElementById('fileInput')
// Listen for file selection
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    fileName=fSB.files[0].name
    docName.value=fileName
    console.log(fileName)
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            atomicData = extractAtomicData(data); // Save extracted atomic data globally
            loadNewMolecule(atomicData)
            for(let i=0;i<atomicData.length;i++){
                updateTable(1, i)
            }
        };  
        reader.readAsText(file);
    }
});

function loadNewMolecule(atomicData){
    positionsX = [];
    positionsY = [];
    positionsZ = [];
    bondVisuals = [];
    atomVisuals = [];
    allAtomsSymbols = [];
    selectedAtoms = [];
    fileFromSelect = [];

    clearScene()
    getAllAtoms(atomicData); // Call function to get all atom symbols after data is extracted
    console.log(allAtomsSymbols); // Log all atom symbols to the console
    addToVisualizer(allAtomsSymbols, atomicData)
    console.log(atomicData)
    createBond(atomicData)
    atoms = atomVisuals[0].children; // Get atom meshes
    createSelectionCube(0,0,0)
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


let atomGroup


function addToVisualizer(allAtomsSymbols, atomicData){
    centerMolecule(atomicData);


    atomGroup=new THREE.Group()

    for(let i=0; i<allAtomsSymbols.length; i++){
        const mySymbol =(atomicData[i].atomicSymbol).replace(/[^a-zA-Z]/g, '');
        let colorH;
        let radius;
        fragSelected.push(i)

        colorH = atomOptions[mySymbol].color;
        radius = atomOptions[mySymbol].radius * scalar; // Apply updated scalar

        let atomMat
        let atomGeo

        if(displayMode){
            atomMat = new THREE.MeshStandardMaterial({color: colorH, 
                metalness:0.6,
                roughness: 0.4
            });
            atomGeo = new THREE.SphereGeometry(radius, 30, 30);

        }else{
            atomMat = new THREE.MeshStandardMaterial({color: colorH});
            atomGeo = new THREE.SphereGeometry(radius, 10, 10);
        }

        const atomMesh = new THREE.Mesh(atomGeo, atomMat);


        // Set atom position using atomicData
        atomMesh.position.x = atomicData[i].coordinates.x * 4;
        atomMesh.position.y = atomicData[i].coordinates.y * 4;
        atomMesh.position.z = atomicData[i].coordinates.z * 4;
        atomMesh.renderOrder=0
        atomMesh.userData.id=i
        atomMesh.userData.originalColor=new THREE.Color(colorH)
        atomMesh.userData.selected=false

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


let needsUpdate = true;  // Flag to track if the scene needs updating


function clearScene() {
    clearBonds()

    for (let i = scene.children.length - 1; i >= 0; i--) {
        const object = scene.children[i];
        // Check if the object is not a light
        if (!(object instanceof THREE.Light)) {
            // Dispose of geometry and material if they exist
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
            // Remove the object from the scene
            scene.remove(object);
        }
    }


    // Optionally, reset your atomVisuals array and any other data you need
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

    let distance
    let checks=0


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




function saveImage(){
    renderer.render(scene,camera)
    let imgData=renderer.domElement.toDataURL("image/png", 1.0)
    const link=document.createElement('a')
    link.setAttribute('href', imgData)
    link.setAttribute('target', '_blank')
    link.setAttribute('download', "canvas.png")
    link.click()
}

window.addEventListener('keyup', function(e){

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
        selectionBox.style.display = 'none'; // Show the box
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
    
    isSelecting = false;
    selectionBox.style.display = 'none'; // Hide the box

    const boxBounds = selectionBox.getBoundingClientRect();
    selectAtom(select)
    select={
        startX:0,
        startY:0,
        endX:0,
        endY:0
    }
});


function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
    
    // Make sure all text meshes face the camera
    if(atomGroup){
        atomGroup.children.forEach(child => {
            if (child.userData.isText) {
                child.lookAt(camera.position);
            }
        });
    }
}


let selectedAtoms=[]

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedAtom = null;  // To track the currently selected atom

function selectAtom(select) {
    // Calculate normalized device coordinates (NDC) for raycasting
    mouse.x = select.startX;
    mouse.y = select.startY;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Get the list of intersected objects (atom meshes)
    const intersects = raycaster.intersectObjects(atomVisuals, true); // 'true' to check child meshes in the atomGroup
    console.log(selectedAtoms)

    if (intersects.length > 0) {
        const selectedObject = intersects[0].object;


        console.log("Selected Object:", selectedObject); // Debug log to check if an atom is clicked


        // Check if an atom was clicked
        if (selectedObject) {
            selectedAtom = selectedObject;
            let index = selectedAtoms.indexOf(selectedAtom);


            if(index !== -1){
                unSelectSpecificAtom(selectedAtom)
                selectedAtoms.splice(index,1)
                removeFromRow(workRow, selectedAtom.userData.id)
                getNumbersFromString(table.rows[workRow].cells[2].innerHTML)
            }else{
                fragSelected[selectedAtom.userData.id]=selectedAtom.userData.id
                console.log(fragSelected)
                updateTable(workRow, selectedAtom.userData.id)
                // Store the selected atom
                selectedAtoms.push(selectedAtom)
                selectedAtom.userData.originalColor = selectedAtom.material.color.getHex();

                // Change color to red to indicate selection
                selectSpecificAtom(selectedAtom, fragColors[workRow-1])
                console.log("Atom selected and color changed to red");  
            }
        }
    } else {
        console.log("No atom selected");
    }
}

const deSelectButton=document.getElementById('deselect')
deSelectButton.addEventListener('click', function(){
    unselectAllAtoms()
})

function unselectAllAtoms() {
    // Loop through each selected atom
    selectedAtoms.forEach(atom => {
        // Reset the atom color to its original color
        atom.material.color.set(atom.userData.originalColor);
    });

    // Clear the selectedAtoms array
    selectedAtoms = [];
    
    console.log("All atoms unselected");
}


let fileFromSelect=[]
function createCustomFile(){
    console.log(selectedAtoms)

    for(let i=0;i<selectedAtoms.length;i++){
        fileFromSelect.push(selectedAtoms[i].position.x,selectedAtoms[i].position.y,selectedAtoms[i].position.z)
    }
    console.log(fileFromSelect)
}
const creatFragButton=document.getElementById('newFrag')


let fragNum=0
let table = document.getElementById("fragTable");

creatFragButton.addEventListener('click', insertRow)

insertRow()
insertRow()



function insertRow() {
    fragNum++;
    workingRowArray.push(0);

    // Get the table element by ID
    let rowIndex = table.rows.length - 1;
    
    // Insert a new row at the end of the table
    let newRow = table.insertRow(rowIndex);
    
    // Insert new cells (columns) in the new row
    let cell1 = newRow.insertCell(0); // First column (checkbox)
    let cell2 = newRow.insertCell(1); // Second column (fragment text)
    let cell3 = newRow.insertCell(2); // Third column (empty cell)

    // Create a checkbox element
    let checkbox = document.createElement('input');
    checkbox.checked = true;
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';

    // Add an event listener to the checkbox
    checkbox.addEventListener('change', function() {
        // Get the row index
        let rowIdx = this.closest('tr').rowIndex;

        if (checkbox.checked) {
            getNumbersFromString(table.rows[rowIdx].cells[2].innerHTML);
            showAtomsInArray(atomsNumberArray);
            console.log(`Checkbox for Fragment ${fragNum} in row ${rowIdx} is checked`);
        } else {
            getNumbersFromString(table.rows[rowIdx].cells[2].innerHTML);
            hideAtomsInArray(atomsNumberArray);
            console.log(`Checkbox for Fragment ${fragNum} in row ${rowIdx} is unchecked`);
        }
    });

    // Add the checkbox to the first cell
    cell1.appendChild(checkbox);

    // Add text content to the second cell
    cell2.innerHTML = `Frg ${fragNum}`;

    // Set the third cell as empty
    cell3.innerHTML = "";
}


function updateTable(row, update=''){
    editRow(row, 3, update)
}

function editRow(rowIndex, column, text) {
    let row = table.rows[rowIndex];
    
    // Remove the text from any other row in the table, but only in column 2 (index 2)
    for (let i = 1; i < table.rows.length - 1; i++) {
        if (i !== rowIndex) {
            let cell = table.rows[i].cells[2]; // target column 2 (index 2)
            
            if (cell && cell.innerHTML) {
                // Only remove the exact match for 'text' from this cell
                let regex = new RegExp("\\b" + text + "\\b", "g"); // Match whole word (word boundaries)
                cell.innerHTML = cell.innerHTML.replace(regex, "").trim(); // Remove text and trim extra spaces
                
                // If the cell becomes empty or contains only spaces, clear it
                if (containsOnlySpacesAndNoNumbers(cell.innerHTML)) {
                    cell.innerHTML = "";
                }
            }
        }
    }

    // Update the specified cell in the row (or add to it if it's not empty)
    let targetCell = row.cells[column - 1]; // target the correct cell
    if (targetCell) {
        if (targetCell.innerHTML) {
            targetCell.innerHTML += (targetCell.innerHTML ? ' ' : '') + text; // Append the new value
        } else {
            targetCell.innerHTML = text; // Just set the value if the cell is empty
        }
    }

    // Update the workingRowArray based on the row modification (swap)
    if (Array.isArray(workingRowArray)) {
        workingRowArray = swapNthElement(workingRowArray, 1, rowIndex - 1);
        console.log(rowIndex - 1);
    } else {
        console.error('workingRowArray is not defined.');
    }
}


function removeFromRow(rowIndex,  text) {

    let row = table.rows[1];

    
    let cell = table.rows[rowIndex].cells[2];
    // Split cell contents by commas and filter out the text
    if(cell.innerHTML){
        cell.innerHTML = cell.innerHTML.replace(text,"")
        if(containsOnlySpacesAndNoNumbers(cell.innerHTML)){
            cell.innerHTML=""
        }
    }

    if (row.cells[2].innerHTML) {
        row.cells[2].innerHTML += (row.cells[2].innerHTML ? ' ' : '') + text; // Append the new valu
        workingRowArray=swapNthElement(workingRowArray,1,rowIndex-1)
    } else {
        row.cells[2].innerHTML = text; // Just set the new value if it's empty
        workingRowArray=swapNthElement(workingRowArray,1,rowIndex-1)
    }
}


function containsOnlySpacesAndNoNumbers(str) {
    return /^[ ]*$/.test(str) || /^[0-9\s]*$/.test(str) && str.trim().length === 0;
}

function swapNthElement(array, newNumber, n) {
    if (array.length >= n) { // Check if the array has at least two elements
        array[n] = newNumber; // Replace the second element (index 1)
    }
    return array; // Return the modified array
}


// Select the table

// Function to handle row click
table.addEventListener("click", function (e) {
    if (e.target.tagName !== "TH") {
        const rows = table.getElementsByTagName("tr");

        // Remove the 'selected' class from all rows
        for (let i = 0; i < rows.length; i++) {
            // if(workingRowArray[i-1]==0){
            rows[i].classList.remove("selected");
            rows[i].style.backgroundColor=""
            // }
        }
    
        // Add the 'selected' class to the clicked row
        if (e.target.tagName === "TD") {
            const row = e.target.parentElement;
            workRow=row.rowIndex
            row.classList.add("selected");
            row.style.backgroundColor=fragColors[workRow-1]
            console.log(workRow)
        }
    }

});

function setActiveRows(rowIndexNum){
    let rows = table.getElementsByTagName("tr");
    const editRow=rows[rowIndexNum]
    editRow.style.backgroundColor=fragColors[rowIndexNum-1]
}

window.addEventListener('click', function(){
    console.log(workingRowArray, workRow)
})


function getNumbersFromString(str) {
    atomsNumberArray=[]
    if (str.length > 0) {
        atomsNumberArray = str.split(' ').filter(item => item !== "").map(Number);
    }
}

// 12 13 4 3


function hideAtomsInArray(arr) {
    console.log(arr)
    // Assuming arr is already an array of numbers
    if(arr.length>0){
        for (let i = 0; i < arr.length; i++) {
            const atom = atomVisuals[0].children[arr[i]]; // Access the first child of the current atom
            const atomNum = atom.userData.id; // Get the atom's user data ID
            console.log(atomNum)
            atom.visible = false; // Hide the atom
            clearBonds()
            createBond(atomicData)
        }
    }
}

function showAtomsInArray(arr) {
    console.log(arr)
    // Assuming arr is already an array of numbers
    for (let i = 0; i < atomVisuals.length; i++) {
        const atom = atomVisuals[0].children[i]; // Access the first child of the current atom
        const atomNum = atom.userData.id; // Get the atom's user data ID
        console.log(atomNum)
        // Check if the index of the current atom is in the array arr
        if (arr.includes(atomNum)) {
            atom.visible = true; // Hide the atom
            clearBonds()
            createBond(atomicData)
        }
    }
}

const fragWindow=document.getElementById('fragWindow')
const fragTableButton=document.getElementById('fragTableButton')

fragTableButton.addEventListener('click', function(){
    fragWindow.classList.toggle('collapse')
    clearBonds()
    createBond(atomicData)
})

// Assuming cuboid and atoms are already created


console.log(atoms)


function checkCuboidIntersection(cuboid, atoms) {
    // Create a Box3 to represent the cuboid
    cuboidBox = new THREE.Box3().setFromObject(cuboid);

    // Loop through each atom in the atoms array
    for (let i = 0; i < atoms.length; i++) {
        const atom = atoms[i];
        atom.material.color.set(atom.userData.originalColor);
    }
    for (let i = 0; i < atoms.length; i++) {
        const atom = atoms[i];

        // Create a Sphere representing the atom's position and radius
        const atomSphere = new THREE.Sphere(atom.position, atom.radius);

        // Check if the cuboid intersects with the atom sphere
        if (cuboidBox.intersectsSphere(atomSphere)) {
            atom.material.color.set(0x00ff00)
            console.log(`Cuboid intersects with atom ${i} (${atom.userData.id})`);
        }
    }
}


function selectSpecificAtom(atom, newColor){
    atom.userData.selected=true
    atom.material.color.set(new THREE.Color(newColor))
}

function unSelectSpecificAtom(atom){
    atom.userData.selected=true
    atom.material.color.set(new THREE.Color(atom.userData.originalColor))
}

function checkSelectionBox(){
    if(atoms){
        checkCuboidIntersection(cuboid, atoms)
    }
}

function createSelectionCube(x,y,z){
    cuboid.position.set(x,y,z)
    cuboid.userData.id=2
    scene.add(cuboid)
}

createSelectionCube(0,0,0)

window.addEventListener('click', onMouseClick);

function onMouseClick(event) {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Perform raycasting
  raycaster.setFromCamera(mouse, camera);

  // Get objects intersected by the ray
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    // Log the clicked object
    const object=intersects[0].object
    console.log('Clicked object:', intersects[0].object);

    if(object.userData.randomID==38120){
        object.material.opacity=0.8
        dimensionSelect.style.display='flex'

    }
  }
}


setActiveRows(2)

animate()

