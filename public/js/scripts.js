$(document).ready(function() {
  var database = firebase.database();
  var provider = new firebase.auth.GithubAuthProvider();

  var DateFormats = {
       short: "DD MMMM - YYYY",
       long: "dddd DD.MM.YYYY HH:mm"
     };

  function clearEditor(){
    $('#editor #id').val('');
    $('#editor #title').val('');
    $('#editor #content').summernote('reset');
  };

  function closeEditor(){
    $('#editor-modal').modal('hide');
  }

  function saveNewPost(data) {
    firebase.database().ref('posts').push(data);
  };

  function saveNewComment(commentData, postID) {
    firebase.database().ref('posts/'+postID+'/comments').push(commentData);
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
      $('#editor-modal').modal('show');
    });

    $('.item.post').click( function(){
      var postID = $(this).data('id');
      var singlePost = firebase.database().ref('posts/'+postID);

      singlePost.once('value', function(snapshot) {

        var postData = snapshot.val();
        console.log("single post data ", postData);
        var source   = $("#post-single-template").html();
        var template = Handlebars.compile(source);
        var html = template(snapshot.val());
        $('#post-single-body').html(html);
        $('#post-modal').modal('show');

        $('#submit-comment').click( function(){
          var commentData={
            "content" : $('#comment-input').val(),
            "datetime": moment().format('h:m A D/M/YY'),
            "username": $('.user-info').data('user-display-name'),
            "uid": $('.user-info').data('uid'),
          };

          var postID = singlePost.key;

          if(commentData.content !==""){
            saveNewComment(commentData,postID);
          }else{
            console.log('Please enter a comment.');
          };
        });

      });

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

  $('.login').click( function(e){
    e.preventDefault();
    firebase.auth().signInWithPopup(provider).then(function(result) {
      $('.login').closest('li').addClass('hide');
      // This gives you a GitHub Access Token. You can use it to access the GitHub API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      console.log(user);

      $('.user-info .avatar').attr('src', user.photoURL);
      $('.user-info .name').html(user.displayName);
      $('.user-info .name').html(user.email);
      $('.user-info').attr('data-user-email', user.email).attr('data-uid', user.uid).attr('data-uid', user.uid).attr('data-user-display-name', user.displayName);
      $('.user-info').removeClass('hide');
      $('.new-post').closest('li').removeClass('hide');
      $('#editor').attr('data-user-email', user.email).attr('data-uid', user.uid).attr('data-uid', user.uid).attr('data-user-display-name', user.displayName);
      // ...
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      // ...
    });
  });

  $('.logout').click(function(e){
    e.preventDefault();
    console.log('log out click');
    $('.user-info .avatar').attr('src', '');
    $('.user-info .name').html('');
    $('.user-info').addClass('hide');
    $('.login').closest('li').removeClass('hide');
    $('.new-post').closest('li').removeClass('hide');
  });


  $('#submit-post').click( function(){
    var postData={
      "title" : $('#title').val(),
      "content" : $('#content').summernote('code'),
      "datetime": moment().format('h:m A D/M/YY'),
      "username": $('#editor').data('user-display-name'),
      "uid": $('#editor').data('uid'),
    };

    if(postData.title && postData.content !==""){
      var postID = $('#id').val();

      //if no post ID save as a new post otherwise update post at ID
      if(!postID){
        saveNewPost(postData);
      }else{
        updatePost(postData, postID);
      };

      clearEditor();
      closeEditor();

    }else{
      console.log('Please enter a title and some content.');
    };
  });


  $('#cancel-edit-post').click( function(){
    clearEditor();
    closeEditor();
  });


});
