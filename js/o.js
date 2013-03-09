//-----------------Abbas' JS Library -----------
//===============make DOM node element object====
function o(s){
return document.getElementById(s);
}
//==============Attach handler to an object for an ====
objectEventHandler = function(o,e,h){
	if(typeof o.addEventListener == "function"){
		o.addEventListener(e,h);
	}
	else{
		o.attachEvent("on"+e,h,false);
	}
};
//================Create Ajax object=========================
HttpObject=function(){//return XMLHttpRequest object or Error
  try{
    return new XMLHttpRequest();
  }
  catch(error){}
  try{
    return new ActiveXObject(Microsoft.XMLHTTP);
  }
  catch(error){}
  try{
    return new ActiveXObject(Msxml2.XMLHTTP);
  }
  catch(error){}
   
  throw new Error("Could not make AJAX request object.");
};
//============check for substring inside main string===========
function inStr(main,sub){
  var flag=false;
  if(main.indexOf(sub) !== -1){
    flag=true;  
  }
  return flag;
};
//==========check if ajax uploads files. Returns true or false=========================
ajaxUploadsFiles = function() {//http://blog.new-bamboo.co.uk/2012/01/10/ridiculously-simple-ajax-uploads-with-formdata
    return supportFileAPI() && supportAjaxUploadProgressEvents() && supportFormData();
//------------------internal functions-----------------------    
    function supportFileAPI() {
        var fi = document.createElement('INPUT');
        fi.type = 'file';
        return 'files' in fi;
    }
//------------------------------------------------------------    
    function supportAjaxUploadProgressEvents() {
        var xhr = new HttpObject;//XMLHttpRequest();
        return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
    }
//------------------------------------------------------------    
    function supportFormData() {
        return !! window.FormData;
   }
};    
//=========================================================================
    function tagArray(o,s){
        return o.getElementsByTagName(s);
    }
//=======================================================    
function forAll(array, aFunction) {
  for (var i = 0; i < array.length; i++)
    aFunction(array[i]);
}
//=================================================
forTwoArrays = function(ary1, ary2, action){
    if (ary1.length != ary2.length) return false;
    for(var i=0; i < ary1.length; i++){
        action(ary1[i],ary2[i]);
    }
    return true;
};
//===================================================
function callAfterMilliseconds(functionName,delay){
    return  setTimeout(functionName, delay)
}
//=====================================================












    
