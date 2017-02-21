$(document).ready(function() {
  var database = firebase.database();
  var DateFormats = {
       short: "DD MMMM - YYYY",
       long: "dddd DD.MM.YYYY HH:mm"
     };


  function clearEditor(){
    $('#editor #id').val('');
    $('#editor #title').val('');
    $('#editor #content').summernote('reset');
  };

  function saveNewPost(data) {
    firebase.database().ref('posts').push(data);
  };

  function updatePost(data, id) {
    console.log(data);
    console.log(id);
    firebase.database().ref('posts/'+id).set(data);
  };

  function updatePostList(latestPosts){
    var myPosts = {
      posts: latestPosts
    };
    console.log(myPosts);
    var source   = $("#post-list-template").html();
    var template = Handlebars.compile(source);
    var html = template(myPosts);
    $('#post-list').html(html);
    console.log('updatign list');

    $('.delete-post').click( function(){
      var postID = $(this).closest('.item').data('id');
      console.log('postid', postID);
      firebase.database().ref('posts/'+postID).remove();
    });

    $('.edit-post').click( function(e){
      var postID = $(this).closest('.item').data('id');
      var initialTitle = $(this).closest('.item').find('.title').text();
      var initialContent = $(this).closest('.item').find('.content').text();
      console.log('initialTitle', initialTitle);
      $('#editor #id').val(postID);
      $('#editor #title').val(initialTitle);

      $('#editor #content').summernote('editor.insertText', initialContent);
    });


  };

  //Checks for new posts
  var postList = firebase.database().ref('posts');
  postList.on('value', function(snapshot) {
    updatePostList(snapshot.val());
    console.log("from check for new post", snapshot.val());
  });



  // init editor wysiwig content
  $('#content').summernote({
    placeholder: 'Write your awesome post here..',
    height: 120,
    toolbar: [
      // [groupName, [list of button]]
      ['style', ['bold', 'italic', 'underline', 'clear']],
      ['font', ['strikethrough']],
      ['fontsize', ['fontsize']],
      ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
    ]
  });

  $('#submit-post').click( function(){
    var postData={
      "title" : $('#title').val(),
      "content" : $('#content').summernote('code'),
      "datetime": Date.now(),
      "username": "Sebastien"
    };
    var postID = $('#id').val();
    if(!postID){
      console.log('no post id found so creating a new post');
      saveNewPost(postData);
    }else{
      updatePost(postData, postID);
    }

    clearEditor();


  });





});
