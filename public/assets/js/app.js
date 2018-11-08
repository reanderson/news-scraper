$("#loader").hide();

$("#scraper").on("click", function () {
  $("#newIcon").hide();
  $("#loader").show();
  $.ajax({
    method: "GET",
    url: "/api/scrape"
  }).then(function (response) {
    console.log(response)
    // If a new article is found, refresh the page
    if (response) {
      location.reload()
    } else {
      console.log("no new articles")
      $("#newIcon").show();
      $("#loader").hide();
    }
  })
})

$(document).on("click", ".comment-btn", function() {
  window.location.href = `/comments/${$(this).attr("data-id")}`
})