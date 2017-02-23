var database = firebase.database();
var provider = new firebase.auth.GithubAuthProvider();

function checkLoginState(){

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      $('.user-info, .new-post-link').show();
      $('.login-link').hide();
      $('.user-info .avatar').attr('src', user.photoURL);
      $('.user-info .name').html(user.displayName);
      $('.user-info .name').html(user.email);
      $('.user-info, #editor').attr('data-user-email', user.email).attr('data-uid', user.uid).attr('data-uid', user.uid).attr('data-user-display-name', user.displayName);
      $('.user-info, .tools').removeClass('hide');
      $('.new-post').closest('li').removeClass('hide');
      } else {
      $('.new-post-link, .user-info').hide();
      $('.user-info .avatar').attr('src', '');
      $('.user-info .name').html('');
      $('.user-info, .tools').addClass('hide');
      $('.login').closest('li').removeClass('hide');
      $('.new-post').closest('li').removeClass('hide');
      $('.login-link').show();
      $('.user-info').removeAttr('data-uid').removeAttr('data-user-email').removeAttr('data-user-display-name');
      console.log('logged out!')
    }
  });
}

//checks if you are the owner of a post
function isOwnerOf(data){
  var currentUserId = $('.user-info').data('uid');
  if(data == currentUserId){
    return(true);
  }else{
    return(false);
  }
}

function clearEditor(){
  $('#editor #id').val('');
  $('#editor #title').val('');
  $('#editor #content').summernote('reset');
}

function closeEditor(){
  $('#editor-modal').modal('hide');
}

function saveNewPost(data) {
  firebase.database().ref('posts').push(data);
}

function saveNewComment(commentData, postID) {
  firebase.database().ref('posts/'+postID+'/comments').push(commentData);
}

function updatePost(data, id) {
  firebase.database().ref('posts/'+id).set(data);
}

function updatePostList(latestPosts){
  var myPosts = {
    posts: latestPosts
  };

  var source   = $("#post-list-template").html();
  var template = Handlebars.compile(source);
  var html = template(myPosts);
  $('#post-list').html(html);

  $('.delete-post').click( function(){
    var postID = $(this).closest('.item').data('id');
    firebase.database().ref('posts/'+postID).remove();
  });

  $('.edit-post').click( function(e){
    var postID = $(this).closest('.item').data('id');
    var initialTitle = $(this).closest('.item').find('.title').text();
    var initialContent = $(this).closest('.item').find('.content').text();
    $('#editor #id').val(postID);
    $('#editor #title').val(initialTitle);
    $('#editor #content').summernote('editor.insertText', initialContent);
    $('#editor-modal').modal('show');
  });

  $('.item.post .title').click( function(){
    var postID = $(this).closest('.item').data('id');
    var singlePost = firebase.database().ref('posts/'+postID);

    singlePost.on('value', function(snapshot) {

      var postData = snapshot.val();
      var source   = $("#post-single-template").html();
      var template = Handlebars.compile(source);
      var html = template(snapshot.val());
      var uid = $('.user-info').data('uid');
      $('#post-single-body').html(html);
      $('#post-modal').modal('show');

      if(!$('.user-info').data('user-display-name')){
        $('#comment-editor').hide();
      }

      $('#submit-comment').click( function(){
        var commentData={
          "content" : $('#comment-input').val(),
          "datetime": moment().format('h:m A D/M/YY'),
          "username": $('.user-info').data('user-display-name'),
          "uid": uid,
        };

        var postID = singlePost.key;

        if (!uid) {
          $('#comment-editor').hide();
        }

        if(commentData.content !==""){
          saveNewComment(commentData,postID);
        }else{
          console.log('Please enter a comment.');
        }
      });
    });
  });
}

$(document).ready(function() {
  checkLoginState();

  //Checks for new posts
  var postList = firebase.database().ref('posts');
  postList.on('value', function(snapshot) {
    updatePostList(snapshot.val());
  });


  // init editor wysiwig content
  $('#content').summernote({
    placeholder: 'Write your awesome post here..',
    height: 120,
    toolbar: [
      // [groupName, [list of button]]
      ['cleaner',['cleaner']], // The Button
      ['style', ['bold', 'italic', 'underline', 'clear']],
      ['font', ['strikethrough']],
      ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['insert',['media','link','hr']],
      ['view',['fullscreen','codeview']],
    ],
    cleaner:{
      notTime:2400, // Time to display Notifications.
      action:'both', // both|button|paste 'button' only cleans via toolbar button, 'paste' only clean when pasting content, both does both options.
      // newline:'<br>', // Summernote's default is to use '<p><br></p>'
      notStyle:'position:absolute;top:0;left:0;right:0', // Position of Notification
      icon:'<i class="note-icon">[Your Button]</i>',
      keepHtml: false, //Remove all Html formats
      keepClasses: false, //Remove Classes
      badTags: ['style','script','applet','embed','noframes','noscript', 'html'], //Remove full tags with contents
      badAttributes: ['style','start'] //Remove attributes from remaining tags
    }
  });

  $('.login').click( function(e){
    e.preventDefault();
    firebase.auth().signInWithPopup(provider).then(function(result) {
      // This gives you a GitHub Access Token. You can use it to access the GitHub API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      checkLoginState();
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
    firebase.auth().signOut().then(function() {
      checkLoginState();
      // Sign-out successful.
    }, function(error) {
      // An error happened.
    });

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
      }

      clearEditor();
      closeEditor();

    }else{
      console.log('Please enter a title and some content.');
    }
  });


  $('#cancel-edit-post').click( function(){
    clearEditor();
    closeEditor();
  });


  $('#post-modal').on('shown.bs.modal', function (e) {
    postUID = $(this).find('.item').data('post-uid');
    console.log(postUID);

    //show edit options if owner
    if (isOwnerOf(postUID)) {
      $(this).find('.tools').removeClass('hide');
    }

    //show comment form if logged in


  });


});
