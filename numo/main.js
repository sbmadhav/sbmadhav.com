import nameTotal from "./app/name-total.js";

const nameInputEle = document.getElementById('name-input');
const nameTotalEle = document.getElementById('name-total');
const nameTotalContainerEle = document.getElementById('name-total-container');
nameInputEle.addEventListener("keyup", () => {
    const total = nameTotal(nameInputEle.value);
    if ( total > 0 ) {
        nameTotalEle.innerHTML = total;
        nameTotalContainerEle.classList.remove('hide');
    } else {
        nameTotalContainerEle.classList.add('hide');
    }
    
});