const API_URL = "https://rithm-jeopardy.herokuapp.com/api/";
const NUMBER_OF_CATEGORIES = 6;
const NUMBER_OF_CLUES_PER_CATEGORY = 5;

let categories = [];
let activeClue = null;
let activeClueMode = 0;
let isPlayButtonClickable = true;

$("#play").on("click", handleClickOfPlay);

async function handleClickOfPlay() {
  if (isPlayButtonClickable) {
    isPlayButtonClickable = false;
    setupTheGame();
  }
}

async function setupTheGame() {
  $("#spinner").show();
  $("#jeopardy thead").empty();
  $("#jeopardy tbody").empty();
  $("#play").text("Restart the Game!");
  $("#active-clue").text("");

  categories = [];
  const categoryIds = await getCategoryIds();
  
  for (let id of categoryIds) {
    categories.push(await getCategoryData(id));
  }
  
  fillTable(categories);
  $("#spinner").hide();
}

async function getCategoryIds() {
  let res = await axios.get(`${API_URL}categories?count=100`);
  let validCategories = res.data.filter(c => c.clues_count >= NUMBER_OF_CLUES_PER_CATEGORY);
  let selectedCategories = _.sampleSize(validCategories, NUMBER_OF_CATEGORIES);
  return selectedCategories.map(c => c.id);
}

async function getCategoryData(categoryId) {
  let res = await axios.get(`${API_URL}category?id=${categoryId}`);
  let clues = res.data.clues.slice(0, NUMBER_OF_CLUES_PER_CATEGORY).map(clue => ({
    id: clue.id,
    value: clue.value || 200,
    question: clue.question,
    answer: clue.answer
  }));
  return { id: res.data.id, title: res.data.title, clues };
}

function fillTable(categories) {
  let $thead = $("#categories");
  let $tbody = $("#clues");

  categories.forEach(category => {
    $thead.append(`<th>${category.title}</th>`);
  });

  for (let i = 0; i < NUMBER_OF_CLUES_PER_CATEGORY; i++) {
    let $row = $("<tr>");
    categories.forEach(category => {
      let clue = category.clues[i];
      $row.append(`<td id="${category.id}-${clue.id}" class="clue">$${clue.value}</td>`);
    });
    $tbody.append($row);
  }
  $(".clue").on("click", handleClickOfClue);
}

function handleClickOfClue(event) {
  if (activeClueMode !== 0) return;
  let [categoryId, clueId] = event.target.id.split("-");
  let category = categories.find(c => c.id == categoryId);
  let clueIndex = category.clues.findIndex(c => c.id == clueId);
  activeClue = category.clues.splice(clueIndex, 1)[0];

  if (category.clues.length === 0) {
    categories = categories.filter(c => c.id != categoryId);
  }

  $(event.target).addClass("viewed");
  $("#active-clue").text(activeClue.question);
  activeClueMode = 1;
}

$("#active-clue").on("click", handleClickOfActiveClue);

function handleClickOfActiveClue(event) {
  if (activeClueMode === 1) {
    activeClueMode = 2;
    $("#active-clue").text(activeClue.answer);
  } else if (activeClueMode === 2) {
    activeClueMode = 0;
    $("#active-clue").text("");

    if (categories.length === 0) {
      isPlayButtonClickable = true;
      $("#play").text("Restart the Game!");
      $("#active-clue").text("The End!");
    }
  }
}
