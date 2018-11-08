
$("#submit").on("click", function (event) {
  event.preventDefault();
  $("#validate").empty()
  const title = $("#title").val().trim();
  const author = $("#author").val().trim();
  const body = $("#body").val().trim();

  if (title === "" || author === "" || body === "") {
    $("#validate").text("You must fill out all fields!")
    return false
  }

  const request = {}
  request.title = title;
  request.author = author;
  request.body = body;
  console.log(request)

  $.ajax({
    method: "POST",
    url: `/api/articles/${$(this).attr("data-articleId")}`,
    data: request
  }).then(function(res) {
    console.log(res)
    $("#title").val("");
    $("#author").val("");
    $("#body").val("");
    location.reload();
  })
})

//call delete comment modal when pressing a delete button
$(document).on("click", ".delete-btn", function() {
      $.ajax({
      url: "/api/notes/" + $(this).attr("data-commentid"),
      type: "GET"
    }).then(comment => {
      //set the title in the delete modal
      $("#titleToDelete").text(comment.title);
      //apply the article & note id to the deleteEntry button
      $("#deleteEntry")
        .attr("data-commentid", $(this).attr("data-commentid"))
        .attr("data-articleid", $(this).attr("data-articleid"));
      $("#deleteEntryModal").modal("show");
    });
  });

  //Pressing the Delete Entry button in the delete modal
  $("#deleteEntry").on("click", function() {
    const articleId = $(this).attr("data-articleid");
    $.ajax({
      url: `/api/articles/${articleId}`,
      method: "PUT",
      data: {
        noteId: $(this).attr("data-commentid")
      }
    }).then(function() {
      location.reload();
    })
  })