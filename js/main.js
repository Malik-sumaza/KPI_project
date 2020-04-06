// json-server --watch ./db/db.json --port 8000
let page = 1;

let pageSearch = 1;
render();

let tbody = $(".tbody");

// Добавление студента и баллов
$(".myForm").on("submit", function (e) {
  // чтобы оставалась на странице
  e.preventDefault();

  let firstName = $(".myForm .firstName");
  let lastName = $(".myForm .lastName");
  let late = $(".myForm .late");
  let tasks = $(".myForm .tasks");
  let present = $(".myForm .presentation");
  let interview = $(".myForm .interview");
  let test = $(".myForm .test");
  let kpi = $(".myForm .kpi");

  // проверка на заполненность
  if (
    !firstName.val() ||
    !lastName.val() ||
    !late.val() ||
    !tasks.val() ||
    !present.val() ||
    !interview.val() ||
    !test.val()
  ) {
    return alert("Please, enter your data!");
  }
  // расчет KPI
  let sum =
    Number(late.val()) +
    Number(tasks.val()) +
    Number(present.val()) +
    Number(interview.val()) +
    Number(test.val());
  let resultKpi = sum / 5;
  kpi.val(`${resultKpi}`);

  let data = $(".myForm").serialize();

  // Сохранение на Json-server
  $.ajax({
    method: "post",
    url: "http://localhost:8000/students",
    data,
    success: render,
    error: function (err) {
      console.log(err);
    },
  });

  // Очищение ячеек
  firstName.val("");
  lastName.val("");
  late.val("");
  tasks.val("");
  present.val("");
  interview.val("");
  test.val("");
  kpi.val("");
});

// Отображение на странице
function render() {
  $.ajax({
    method: "get",
    url: `http://localhost:8000/students/?_page=${page}&_limit=5`,
    success: function (data) {
      tbody.html("");
      data.forEach((item) => {
        tbody.append(`
        <tr data-id="${item.id}">
          <td>${item.firstName}</td>
          <td>${item.lastName}</td>
          <td>${item.late}</td>
          <td>${item.tasks}</td>
          <td>${item.presentation}</td>
          <td>${item.interview}</td>
          <td>${item.test}</td>
          <td>${item.kpi}</td>
          <td>
            <button id="btn-edit" data-id="${item.id}">Edit</button>
          </td>
          <td>
            <button class="btn-del" data-id="${item.id}">Delete</button>
          </td>    
        </tr>
        `);
      });
    },
  });
}
function paginationRender(data) {
  $(".result").html("");
  data.map((item) => {
    $(".result").append(`
      <li>
        <div>Firstname: <span>${item.firstName}</span></div>
        <div>Lastname: <span>${item.lastName}</span></div>
        <div>KPI: <span>${item.kpi}</span></div>
      </li>
    `);
  });
}

// Модальное окно
$(document).on("click", ".popup-fade", function (e) {
  if (e.target !== this) return;
  $(".popup-fade").toggle();
});

$(document).on("click", ".popup-close", function () {
  $(".popup-fade").toggle();
});

// Редактирование в модальном окне
tbody.on("click", "#btn-edit", function (e) {
  let id = $(e.target).attr("data-id");
  $(".popup-fade").toggle();
  $(".popup-fade").attr("data-id", id);
  $.ajax({
    method: "get",
    url: `http://localhost:8000/students/${id}`,
    success: function (data) {
      let i = 0;
      for (let key in data) {
        $(`.popup .${key}`).val(data[key]);
      }
      let arr = [];

      // График
      fetch(`http://localhost:8000/students/${id}`)
        .then((result) => result.json())
        .then((data) => {
          arr.push(
            +data.late,
            +data.tasks,
            +data.presentation,
            +data.interview,
            +data.test
          );
          console.log(arr);

          Chart.defaults.global.defaultFontColor = "black";
          Chart.defaults.global.defaultFontSize = 10;
          var ctx = document.getElementById("myChart").getContext("2d");
          var chart = new Chart(ctx, {
            // The type of chart we want to create
            type: "radar",
            // The data for our dataset
            data: {
              labels: ["Late", "Tasks", "Presentation", "Interview", "Test"],
              datasets: [
                {
                  label: "KPI",
                  backgroundColor: "rgb(00, 255, 00, 0.1)",
                  borderColor: "rgb(180, 126, 24)",
                  data: arr,
                },
              ],
            },
            // Configuration options go here
            options: {
              responsive: false,
              scale: {
                ticks: {
                  suggestedMin: 0,
                  suggestedMax: 100,
                },
              },
              legend: {
                labels: {
                  fontColor: "black",
                  fontSize: 20,
                },
              },
            },
          });
        });
    },
  });
});

$(".popup .btn").on("click", function (e) {
  e.preventDefault();
  let id = $(".popup-fade").attr("data-id");
  let data = $(".popup .inputs").serialize();
  console.log(id);
  $.ajax({
    method: "patch",
    url: `http://localhost:8000/students/${id}`,
    data,
    success: () => {
      $(".popup-fade").toggle();
      render();
    },
  });
});

// Удаление
tbody.on("click", ".btn-del", (e) => {
  let s = confirm("Are you sure you want to delete?");
  let id = $(e.target).attr("data-id");
  if (s === true) {
    $.ajax({
      method: "delete",
      url: `http://localhost:8000/students/${id}`,
      success: render,
    });
  } else return;
});

// Пагинация
$(".prev-btn").on("click", function () {
  if (page === 1) {
    alert("This is the first page! No previous page!");
    return;
  }
  --page;
  render();
});

$(".next-btn").on("click", function () {
  ++page;
  fetch(`http://localhost:8000/students/?_page=${page}&_limit=5`)
    .then((result) => result.json())
    .then((data) => {
      if (data.length === 0) {
        alert("This is the last page! No next page!");
        page--;
        return;
      } else {
        render();
      }
    });
});

let inpVal2 = "";

// Поиск
$(".search-btn").on("click", function () {
  let input = $(".search input").val();
  inpVal2 = $(".search input").val();
  if (input == "") {
    alert("Please enter a name to search");
    return;
  }

  $.ajax({
    method: "get",
    url: `http://localhost:8000/students?_page=1&_limit=5&q=${input}`,
    success: function (data) {
      if (data.length == 0) {
        alert("No results were found for your request");
        return;
      }
      $(".result-list").css("display", "block");
      $(".result").html("");
      data.forEach((item) => {
        $(".result").append(`
          <li>
              <div>Firstname: <span>${item.firstName}</span></div>
              <div>Lastname: <span>${item.lastName}</span></div>
              <div>KPI: <span>${item.kpi}</span></div>
          </li>          
        `);
      });
    },
  });
});

// Пагинация в поиске
$(".prev-btn-search").on("click", function () {
  if (pageSearch === 1) {
    alert("This is the first page! No previous page!");
    return;
  }
  --pageSearch;
  fetch(
    `http://localhost:8000/students?_page=${pageSearch}&_limit=5&q=${inpVal2}`
  )
    .then((result) => result.json())
    .then((data) => {
      if (data.length === 0) {
        alert("This is the last page! No next page!");
        pageSearch--;
        return;
      } else {
        paginationRender(data);
      }
    });
});

$(".next-btn-search").on("click", function () {
  // console.log(pageSearch)
  ++pageSearch;
  // console.log(pageSearch)
  fetch(
    `http://localhost:8000/students?_page=${pageSearch}&_limit=5&q=${inpVal2}`
  )
    .then((result) => result.json())
    .then((data) => {
      if (data.length === 0) {
        alert("This is the last page! No next page!");
        pageSearch--;
        return;
      } else {
        paginationRender(data);
      }
    });
});

//Якорь

$('a[href^="#"]').click(function () {
  elementClick = $(this).attr("href");
  destination = $(elementClick).offset().top;
  {
    $("html,body").animate({ scrollTop: destination }, 1000);
  }
  return false;
});
