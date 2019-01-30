import nameTotal from "./app/name-total.js";
import dobTotal from "./app/dob-total.js";

const nameInputEle = document.getElementById('name-input');
const nameTotalEle = document.getElementById('name-total');
const nameTotalContainerEle = document.getElementById('name-total-container');
const dobButtonEle = document.getElementById('dob-button');
const dobInputEle = document.getElementById('dob-input');
const dobVitalEle = document.getElementById('dob-vital');
const dobContainerEle = document.getElementById('dob-container');
const dobCorpalEle = document.getElementById('dob-corpal');
nameInputEle.addEventListener("keyup", () => {
    const total = nameTotal(nameInputEle.value);
    if ( total > 0 ) {
        nameTotalEle.innerHTML = total;
        nameTotalContainerEle.classList.remove('hide');
    } else {
        nameTotalContainerEle.classList.add('hide');
    }
    
});

dobButtonEle.addEventListener("click", () => {
    const total = dobTotal(dobInputEle.value);
    if ( dobInputEle.value) {
        dobVitalEle.innerHTML = total.vital;
        dobCorpalEle.innerHTML = total.corpal;
        dobContainerEle.classList.remove('hide');
    } else {
        dobContainerEle.classList.add('hide');
    }
});