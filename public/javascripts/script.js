document.addEventListener('DOMContentLoaded', () => {

  console.log('IronGenerator JS imported successfully!');

}, false);

//Remove logic for rating stars

document.getElementById('one').addEventListener("click", function () {
  let checkingclass = document.getElementById('one').className;
  document.getElementById("rating-content-input").value = 1;
  if (checkingclass.includes("unchecked")) {
    document.getElementById('one').setAttribute("class", "fa fa-star checked");
    document.getElementById('two').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('three').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('four').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('five').setAttribute("class", "fa fa-star unchecked");
    document.getElementById("starButton").submit()
  }
  else {
    document.getElementById('one').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('two').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('three').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('four').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('five').setAttribute("class", "fa fa-star unchecked");
  }
});


document.getElementById('two').addEventListener("click", function () {
  let checkingclass = document.getElementById('two').className;
  document.getElementById("rating-content-input").value = 2;
  if (checkingclass.includes("unchecked")) {
    document.getElementById('one').setAttribute("class", "fa fa-star checked");
    document.getElementById('two').setAttribute("class", "fa fa-star checked");
    document.getElementById('three').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('four').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('five').setAttribute("class", "fa fa-star unchecked");
    document.getElementById("starButton").submit()
  }
  else {
    document.getElementById('one').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('two').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('three').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('four').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('five').setAttribute("class", "fa fa-star unchecked");
  }
});



document.getElementById('three').addEventListener("click", function () {
  let checkingclass = document.getElementById('three').className;
  document.getElementById("rating-content-input").value = 3;
  if (checkingclass.includes("unchecked")) {
    document.getElementById('one').setAttribute("class", "fa fa-star checked");
    document.getElementById('two').setAttribute("class", "fa fa-star checked");
    document.getElementById('three').setAttribute("class", "fa fa-star checked");
    document.getElementById('four').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('five').setAttribute("class", "fa fa-star unchecked");
    document.getElementById("starButton").submit()
  }
  else {
    document.getElementById('one').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('two').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('three').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('four').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('five').setAttribute("class", "fa fa-star unchecked");
  }
});



document.getElementById('four').addEventListener("click", function () {
  let checkingclass = document.getElementById('four').className;
  document.getElementById("rating-content-input").value = 4;
  if (checkingclass.includes("unchecked")) {
    document.getElementById('one').setAttribute("class", "fa fa-star checked");
    document.getElementById('two').setAttribute("class", "fa fa-star checked");
    document.getElementById('three').setAttribute("class", "fa fa-star checked");
    document.getElementById('four').setAttribute("class", "fa fa-star checked");
    document.getElementById('five').setAttribute("class", "fa fa-star unchecked");
    document.getElementById("starButton").submit()
  }
  else {
    document.getElementById('one').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('two').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('three').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('four').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('five').setAttribute("class", "fa fa-star unchecked");
  }
});


document.getElementById('five').addEventListener("click", function () {
  let checkingclass = document.getElementById('five').className;
  document.getElementById("rating-content-input").value = 5;
  if (checkingclass.includes("unchecked")) {
    document.getElementById('one').setAttribute("class", "fa fa-star checked");
    document.getElementById('two').setAttribute("class", "fa fa-star checked");
    document.getElementById('three').setAttribute("class", "fa fa-star checked");
    document.getElementById('four').setAttribute("class", "fa fa-star checked");
    document.getElementById('five').setAttribute("class", "fa fa-star checked");
    document.getElementById("starButton").submit()
  }
  else {
    document.getElementById('one').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('two').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('three').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('four').setAttribute("class", "fa fa-star unchecked");
    document.getElementById('five').setAttribute("class", "fa fa-star unchecked");
  }
});

function getContent(){
  document.getElementById("my-textarea").value = document.getElementById("my-content").innerHTML;
}

