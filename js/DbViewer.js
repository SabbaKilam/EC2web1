$(document).ready(function(){
window.resizeTo(625,770);
window.moveTo(400,50);
$('#sqltextarea').addClass('border');
$('#divSQL').addClass('border');
$('#divSelect').addClass('border');
$('#scrollfields').addClass('scroll');
$('input:text').addClass('tealBack');
$('#captions').addClass('fontBoldBlack');
$('#tablecount').addClass('fontBoldBlack');
$('#recordcount').addClass('fontBoldBlack');
$('#pathname').addClass('fontBoldBlack');
$('span').addClass('fontBoldBlack')
$('#currentcount').addClass('hide')
$('#pathname').bind('dblclick',function(){
alert('Full path to database file: '+$('#pathname').text());
});
var db = new DbStuff();//maybe this instance should exist independent of triggered events
document.getElementById('datapath').focus;
//==========================================================================================
//Define a "Class" object, an instance of which manasges all database items and activities
//==========================================================================================
function DbStuff(){
    this.i;
    this.j;
    this.tableNames = [];
    this.fieldNames = [];
    this.cat = new ActiveXObject("ADOX.Catalog");
    this.conn = new ActiveXObject("ADODB.Connection");
    this.rs = new ActiveXObject("ADODB.RecordSet");
    this.noPathJetConn = "Provider=Microsoft.Jet.OLEDB.4.0;Persist Security Info=False;Data Source=";
    this.noPathAceConn = "Provider=Microsoft.ACE.OLEDB.12.0;Persist Security Info=False;Data Source=";
    this.strConn = "";
    this.adOpenDynamic = 2;
    this.adLockOptimistic = 3;
    this.mostRecentQuery = '';
    this.previousQuery = '';
    this.currentSuggestLength='';
    this.previousSuggestLength='';
    this.searchPrompt='';
    this.searchPrefix='Search by ';
    this.maxFields;
    this.maxRecords;
    //.................................
    this.openDB = function(dataPath,query){
        this.dataPath = dataPath;
        this.query = query;
        this.strConn=this.noPathJetConn + this.dataPath; //Try the "Jet" provider
        if(this.conn.State===1){ this.conn.Close();}
        if(this.cat.ActiveConnection!==null){this.cat.ActiveConnection.Close();}
        if(this.rs.State===1){this.rs.Close();} 
        try    {    
            this.conn.Open (this.strConn, '', '');
        }
        catch(err){
            try{
                this.strConn=this.noPathAceConn + this.dataPath; //Okay, then try the "Ace" provider
                if(this.conn.State===1){ this.conn.Close();}
                if(this.cat.ActiveConnection!==null){this.cat.ActiveConnection.Close();}
                if(this.rs.State===1){this.rs.Close();} 
                this.conn.Open (this.strConn, "", "");
            }
            catch(err){
                alert(err.message);
            }
        }
        try{
            this.cat.ActiveConnection = this.strConn; //Connect to the database catalog to get a list of tables.
            this.tableNames=[];//re-initialize array of db table names
            for(this.i=0;this.i <this.cat.Tables.Count; this.i++)//Internal tables are prefixed with "MSys."
            {
            this.name = this.cat.Tables(this.i).Name; //Only store the tables whose names don't start with "MSys."
            if(this.name.substr(0,4)!=="MSys"){this.tableNames[this.tableNames.length]=this.name;}
            } 
        }
        catch(err){
            alert('Trouble getting catalog of tables: '+err.message);
        }
        try{
            if(query!=='' && query!==null){// query!==undefined or query!==null (don't know which one to use)
                this.previousQuery=this.mostRecentQuery; //save this and previous query
                this.mostRecentQuery=query;
                this.rs.Open(query,this.conn,this.adOpenDynamic,this.adLockOptimistic);// Open the database.
                this.maxFields=this.rs.Fields.count; //Record number of fields.
                this.fieldNames=[]; //redefine the array to clear out previous use's leftovers! 
                for(this.i=0;this.i<this.maxFields;this.i++) 
                {
                this.fieldNames[(this.i)]= this.rs.Fields(this.i).Name;//put all the names in an array
                }


                //determine the number of records
                this.maxRecords=0;
                this.rs.MoveFirst;
                while(!this.rs.EOF && !this.rs.BOF)
                {
                this.maxRecords++;
                this.rs.MoveNext;
                } 
                // initialize a two-dimensional array
                this.records=[]; //declare an array of records
                for( this.i=0 ; this.i<this.maxRecords; this.i++ )//
                {this.records[this.i] = [];}//Let each record hold another array (of fields to come)
                // Fills array with records of the current recordset, each containing all the field values.  ..
                //...this is the full text-based record set as an internal two-dimensional array
                this.rs.MoveFirst;
                for(this.j=0;this.j<this.maxRecords;this.j++)
                {
                for(this.i=0;this.i<this.maxFields;this.i++)
                {
                if(!this.rs.EOF && !this.rs.BOF){}
                {this.records[this.j][this.i]=this.rs.Fields(this.i).Value;}//create the array of records!
                }
                this.rs.MoveNext;
            }
        } 
        }
        catch(err){
            if(err.number+''!=='-2146824584')
            {
                alert("trouble with dbSuff's 'openDB()' function: " + err.message+"\nError no.: "+err.number);
            }
        }
    };
    this.closeDB = function(){
        if(this.conn.State===1){ this.conn.Close();}
        if(this.cat.ActiveConnection!==null){this.cat.ActiveConnection.Close();}
        if(this.rs.State===1){this.rs.Close();}
    };
}// END of DbStuff

//........................................ Wiring element events handlers .........................................................
//===========================================================================================
// HOOK "file" element click without jquery to fill dropdown list with table names "pre-query."
//============================================================================================
document.getElementById('datapath').onchange=function(){ // triggered after browsing for a new database file
    $('#tablecount').text('Tables:');
    db.closeDB();
    //====================================================================== 
    //.....HOOK SQL BUTTON CLICK EVENT HERE (depends on new datapath value...
    //======================================================================
    $('#sqlbutton').bind('click',function(){
        var q = document.getElementById('sqltextarea').value;//save this query
        if (q==='' || q===db.mostRecentQuery){return;} //|| q===db.mostRecentQuery
        var pattern1 = 'SELECT '; //"SELECT" with a space
        var pattern2 = 'INTO ';//INTO with space
        var regExPattern1 = new RegExp(pattern1,'i'); //make it a case-insensitive Regular expression 
        var result1 =q.match(regExPattern1);
        var regExPattern2 = new RegExp(pattern2,'i'); //make it a case-insensitive Regular expression 
        var result2 =q.match(regExPattern2); 
        if(result1===null || result2!==null){//if query is not a SELECT query,or if so, it's SELECT INTO
            var dbasePath=document.getElementById('datapath').value;
            db.openDB(dbasePath,q);//execute the non-SELECT query and..
            refreshTables(); //get the new or modified tables and ..
            document.getElementById('tablenames').onchange=function(){
                tableChange(); 
            };
            document.getElementById('sqltextarea').value = q; //... restore query to textarea
            return; // return
        } 
        document.getElementById('tablenames').selectedIndex=0;
        pathChangeCleanUp(); // clean up
        document.getElementById('sqltextarea').value = q; //... restore query to textarea
        var dbasePath=document.getElementById('datapath').value; 
        //alert('Most Recent Query: '+db.mostRecentQuery+'\nPrevious Query: '+db.previousQuery);
        dbaseQuery(dbasePath,q); 
        $('#recordnames').focus(); //focus on the record changer drop down box
    });
    //........................................................... 
    pathChangeCleanUp();
    var strPath=$('#datapath').val();
    var filename = strPath.replace(/^.*\\/, '');
    $('#filename').text(filename);
    $('#pathname').html('&nbsp;&nbsp;'+strPath);
    var dbasePath=document.getElementById('datapath').value; //specifies the path of the database file ;
    var query ='';
    //document.getElementById('fieldnames').innerHTML='' //Clear ou the old field names-> NOT ANY MORE
    db.openDB(dbasePath, query); //* Open the database with no query


    if(dbasePath!==null && dbasePath!=='') // maybe 'null' should be replaced by 'undefined.'// 
    {
    var objDivTables=document.getElementById('divtables');
    //clear out the drop box and re-create it to start fresh in size and content
    objDivTables.innerHTML='';
    objDivTables.innerHTML='<select id="tablenames" style="width: 180px"></select>';
    //Hook "tablenames" element "change" event
    // Have to hook the event in here since this is where the element is re-created.
    // This handler does not work if declared earlier or if select element is re-created later
    //=================================================================
    //Hook "tablenames" element "change" event
    //==================================================================
    document.getElementById('tablenames').onchange=function()
    {
    tableChange();
    };
    //======================================================================
    // ...back to handling the datapath change event: collect the table names and ...
    // put them in a dropdown list.
    var strTablePrompt='____Choose a Table___'
    var i=0;
    var objOption = document.createElement("option"); // our first dropdown option ... 
    objOption.value = ""+i;
    objOption.id="table"+i;
    objOption.text = strTablePrompt; 
    document.getElementById('tablenames').add(objOption,i); //... is the prompt string
    for (var i=0;i<db.tableNames.length;i++) // loop through all the table names
    {
    var objOption = document.createElement("option"); 
    objOption.value = ""+(i+1);
    objOption.id="table"+(i+1);
    objOption.text = db.tableNames[i]; // the "i-th" table name goes int the ...
    document.getElementById('tablenames').add(objOption,(i+1)); // ... "i-th plus 1 option spot ...
    //... because the prompt string got the first spot and 'bumped' the others up 
    //alert('objDivTables.innerHTML :'+objDivTables.innerHTML);
    }
    //alert('objDivTables.innerHTML :'+objDivTables.innerHTML);
    //document.getElementById('tablecount').text=rs.tableNames.length+' tables'; 
    var phr = sngPlr(db.tableNames.length,'Table') 
    $('#tablecount').text(phr+':');
    if(db.tableNames.length===1){
    document.getElementById("tablenames").selectedIndex=1;
    tableChange();
    $('#recordnames').focus();
    }
    else{document.getElementById('tablenames').focus();}
    }
    //.................................................................................
    function dbaseQuery(path,query)
    {
    if(query==db.mostRecentQuery){return}
    try
    {
    db.openDB(path,query); //* Open the database
    // Prepare to show every field of the first record (record 0), seen through a limited (6-field)...
    //...scroll-able window.
    $('#tblDisplayFields').html('');// clear shown fields (might be redundant)
    for(var i=0;i<db.maxFields;i++)
    {
    //"add" table rows and table data, one at a time
    var strTableStuff=$('#tblDisplayFields').html() //get current rows and data, and ...
    //add in the next tbale rows and table data
    strTableStuff+='<tr><td ><input type="radio" id="radio'+i+'" name="radioselectedfield" checked="true" style="cursor: pointer"></td><td><span id="spanfieldname'+i+'" name="chosenfield" style="cursor: pointer" ></span></td><td><input type="text" readonly id="inputfieldvalue'+i+'" size="35"></td></tr>';
    $('#tblDisplayFields').html(strTableStuff); 
    //Put in the field's name...
    document.getElementById('spanfieldname'+i).innerHTML=db.fieldNames[i];
    //... and value
    document.getElementById('inputfieldvalue'+i).value=db.records[0][i];
    }
    //inform of the number of fields
    var sp=sngPlr(db.maxFields,'Field')
    $('#fieldsLegend').text(sp+':')
    //colorize the text boxes
    $('input:text').addClass('tealBack fontBoldBlack');
    $('span').addClass(' fontBoldBlack');
    // Make sure the first radio button is true, and no others.
    document.getElementById('radio0').checked=true;
    for(var i=1;i<db.maxFields;i++)
    {
    document.getElementById('radio'+i).checked=false;
    } 
    //==================================================================
    // Probably need to hook radio button events here because we re-created them above
    //=====================================================================
    $('span[name=chosenfield],input[name=radioselectedfield]').bind('click',function(){
    var selected=0;
    var i=0;
    for( var i=0;i<db.maxFields;i++)
    {
    if(this.id!='spanfieldname'+i && this.id!='radio'+i){$('#radio'+i).attr('checked','false')}
    else{$('#radio'+i).attr('checked','true');selected=i;break}
    }
    document.getElementById('currentcount').innerHTML='.';
    document.getElementById('currentcount').style.visibility='hidden';
    var objDivRecords=document.getElementById('divrecords');
    objDivRecords.innerHTML='';
    objDivRecords.innerHTML='<select id="recordnames" style="width: 300px"></select>'; 
    //================================================================================================ 
    //Hook "recordnames" element "change" event here because we re-created record select element here
    //================================================================================================
    document.getElementById('recordnames').onchange=function()
    { 
    db.previousSuggestLength=0;
    db.currentSuggestLength=0;
    recordChanger(); 
    } 
    //"selected" is now the index for the selected field
    for (var i=0;i<db.maxRecords;i++) // loop through all the record names
    {
    var objOption = document.createElement("option"); 
    objOption.value = "record"+(i);
    objOption.id="record"+(i);
    objOption.text = db.records[i][selected]; // the "i-th" record name goes in the ...
    var strRecordField = document.getElementById('recordfield')
    document.getElementById('recordnames').add(objOption,i);
    }
    var p = sngPlr(db.maxRecords,'Record') 
    $('#recordcount').text(p);//show the count of records
    strRecordField.innerHTML='&nbsp; by '+'"'+db.fieldNames[selected]+'"'; //show which fields we can choose a record by
    $('#currentcount').text('Record 1 of '+db.maxRecords)
    document.getElementById('currentcount').style.visibility='visible';
    $('#recordnames').focus();
    db.searchPrompt=db.searchPrefix+'"'+db.fieldNames[selected]+'"' ;
    $('#suggest').removeClass();
    $('#suggest').addClass('liteGray');
    $('#suggest').val(db.searchPrompt);
    }); 
    //...................................................................................
    //clear out the drop box and re-create it to start fresh in size and content 
    var objDivRecords=document.getElementById('divrecords');
    objDivRecords.innerHTML='';
    objDivRecords.innerHTML='<select id="recordnames" style="width: 300px"></select>'; 
    //================================================================================================ 
    //Hook "recordnames" element "change" event here because we re-created record select element here
    //================================================================================================
    document.getElementById('recordnames').onchange=function()
    { 
    db.previousSuggestLength=0;
    db.currentSuggestLength=0;
    recordChanger(); 
    }
    //=================================================================================================
    // when record change is hooked, so too should "suggest" be hooked since it depends on recorndnames
    //==================================================================================================
    $('#suggest').bind('blur',function(){
    if($(this).val()===''){
    $(this).removeClass();
    $(this).addClass('liteGray');
    $(this).val(db.searchPrompt);
    }
    });
    $('#suggest').bind('click',function(){
    if($(this).val()===db.searchPrompt)
    {
    $(this).removeClass();
    $(this).addClass('fontBoldBlack');
    $(this).val('');
    } 
    });
    $('#suggest').bind('keyup change',function(){
    $(this).removeClass();
    $(this).addClass('fontBoldBlack');
    try
    {
    var lenSuggestStr = document.getElementById('suggest').value.length;
    db.previousSuggestLength=db.currentSuggestLength;
    db.currentSuggestLength=lenSuggestStr;
    if (lenSuggestStr===0){
    document.getElementById('recordnames').selectedIndex = 0;
    recordChanger();
    return;
    }
    var initialIndex = document.getElementById('recordnames').selectedIndex;
    var count = document.getElementById('recordnames').length;
    //alert('Previous Length: '+db.previousSuggestLength+'\nCurrent length:'+db.currentSuggestLength)
    if(db.currentSuggestLength>=db.previousSuggestLength)
    {
    for(var i=initialIndex;i<count;i++)
    {
    var pattern = $(this).val(); 
    if($('#casesensitive').attr('checked'))
    {var regExPattern = new RegExp(pattern);}
    else{var regExPattern = new RegExp(pattern,'i');}//ignore case unless box is checked
    var strTarget = document.getElementById('recordnames').options[i].text;
    var result = strTarget.match(regExPattern);
    if(strTarget.match(regExPattern)!=null)
    {
    document.getElementById('recordnames').selectedIndex = i;
    if(i!==initialIndex){recordChanger();}
    break;
    }
    }
    }
    else
    {
    for(var i=0;i<initialIndex;i++) //
    //for(var i=initialIndex-1;i>=0;i--) //only works for "i=initialIndex-1" 
    {
    var pattern = $(this).val();


    if($('#casesensitive').attr('checked'))
    {var regExPattern = new RegExp(pattern);}
    else{var regExPattern = new RegExp(pattern,'i');}//ignore case unless box is checked 
    var regExPattern = new RegExp(pattern,'i'); 
    var strTarget = document.getElementById('recordnames').options[i].text; 
    var result = strTarget.match(regExPattern); 
    if(strTarget.match(regExPattern)!=null)
    {
    document.getElementById('recordnames').selectedIndex = i;
    if(i!==initialIndex){recordChanger();}
    break;
    }
    }
    }
    }
    catch(err)
    {
    alert(err.message)
    }
    });
    //................................ 
    // ...back to handling the tablenames change event: collect the table names and ...
    // put them in a dropdown list.
    for (var i=0;i<db.maxRecords;i++) // loop through all the record names
    {
    var objOption = document.createElement("option"); 
    objOption.value = ""+i;
    objOption.id="record"+i;
    objOption.text = db.records[i][0]; // the "i-th" record name goes in the ...
    var strRecordField = document.getElementById('recordfield')
    document.getElementById('recordnames').add(objOption,i);
    }
    var p = sngPlr(db.maxRecords,'Record') 
    $('#recordcount').text(p);//show the count of records
    strRecordField.innerHTML='&nbsp; by '+'"'+db.fieldNames[0]+'"'; //show by which fields we can choose a record
    $('#currentcount').text('Record 1 of '+db.maxRecords)
    document.getElementById('currentcount').style.visibility='visible';
    db.searchPrompt=db.searchPrefix+'"'+db.fieldNames[0]+'"' 
    $('#suggest').removeClass();
    $('#suggest').addClass('liteGray');
    $('#suggest').val(db.searchPrompt);
    }//end of "try"
    catch(err){alert(''+err.message+'\n Error no.: '+err.number)}
    }
    //.................................................................................
    function pathChangeCleanUp()
    {
    //If called too early, db isn't instantiated and db.maxFields is undefined
    //zero out field names:
    for(var i=0;i<db.maxFields;i++)
    {
    $('#spanfieldname'+i).text(''); 
    $('#inputfieldvalue'+i).val('');
    }
    // and zero out the number of fields announced
    $('#fieldsLegend').text('Fields:')
    // and zero out the number of tables announced
    $('#recordfield').text(' Records');
    $('#recordcount').text('0');
    $('#sqltextarea').val('');
    $('#divrecords').html('<select id="recordnames" style="width: 300px"><option>___Choose a Record___</option></select>');
    $('#currentcount').text('__');
    $('#currentcount').removeClass();
    $('#currentcount').addClass('hide');
    document.getElementById('currentcount').style.visibility='hidden'; 
    }
    function sngPlr(number, singWrd)
    {
    var rtWrd;
    var rtPhr;
    if(number*1===1){rtWrd=singWrd;}
    else{rtWrd=singWrd+'s';} 
    rtPhr=number+' '+rtWrd;
    return rtPhr;
    }
    function recordChanger()
    {
    $('#currentcount').removeClass();
    $('#currentcount').addClass('show fontBoldBlack');
    var index = document.getElementById("recordnames").selectedIndex; //point to correct record 
    for(var i=0;i<db.maxFields;i++)
    {
    document.getElementById('inputfieldvalue'+i).value=db.records[index][i]; 
    }
    $('#currentcount').text('Record '+(index+1)+' of '+db.maxRecords)
    document.getElementById('currentcount').style.visibility='visible'; 
    }
    function backAndForth(callerID)
    {
    var count = document.getElementById('recordnames').selectedIndex; 
    if((callerID==='nextrecord' || callerID==='fastforward') && count!==db.maxRecords-1)
    {
    count++; 
    document.getElementById('recordnames').selectedIndex=count;
    recordChanger(); 
    }
    else if((callerID==='previousrecord' || callerID==='rewind') && count!==0)
    {
    count--; 
    document.getElementById('recordnames').selectedIndex=count;
    recordChanger(); 
    }
    else{return}
    }
    function tableChange()
    { 
    //alert('In table change event');
    db.previousSuggestLength=0;
    db.currentSuggestLength=0;
    pathChangeCleanUp(); 
    var phr = sngPlr(db.tableNames.length,'Table') 
    $('#tablecount').text(phr+':'); 
    var index = document.getElementById("tablenames").selectedIndex; //point to correct table
    if(index!==0)
    { 
    var table = document.getElementById('table'+index).innerHTML;
    var query ='SELECT * FROM  [' + table + ']'; 
    if($('#sqltextarea').val()===''){$('#sqltextarea').val(query)};//put query in textarea
    // only if textarea is blank
    dbasePath=document.getElementById('datapath').value;
    dbaseQuery(dbasePath,query);
    }
    $('#currentcount').text('Record 1 of '+db.maxRecords)
    document.getElementById('currentcount').style.visibility='visible';
    //==============================================================
    // Hook record scroll buttons here. Not sure if there is a better place yet
    //===============================================================
    //Defective! I think Jquery is the culprit 
    /*
    $('#nextrecord, #previousrecord').bind('click',function(){ //hook for single steps
    backAndForth($(this).attr('id'));
    });
    */
    //Defective! I think Jquery is the culprit
    // tryin traditional instead
    document.getElementById('nextrecord').onclick=function(){
    backAndForth('nextrecord'); 
    };
    document.getElementById('previousrecord').onclick=function(){
    backAndForth('previousrecord'); 
    };
    //These two traditional javascript methods seem to work fine: 
    document.getElementById('fastforward').onmousedown=function(){
    var callerID=$(this).attr('id');
    this.timerID = setInterval(function(){ 
    backAndForth(callerID)},35);
    document.getElementById(callerID).onmouseup=function(){
    this.timerID && clearInterval(this.timerID) //could also be: if(this.timerID){clearInterval(this.timerID)} 
    };
    document.getElementById(callerID).onmouseout=function(){
    this.timerID && clearInterval(this.timerID) 
    };
    };
    document.getElementById('rewind').onmousedown=function(){
    var callerID=$(this).attr('id');
    this.timerID = setInterval(function(){ 
    backAndForth(callerID)},35);
    document.getElementById(callerID).onmouseup=function(){
    this.timerID && clearInterval(this.timerID) 
    };
    document.getElementById(callerID).onmouseout=function(){
    this.timerID && clearInterval(this.timerID) 
    };
    }; 
    $('#firstrecord, #lastrecord').bind('click',function(){ 
    if($(this).attr('id')==='firstrecord')
    { 
    document.getElementById('recordnames').selectedIndex=0;
    recordChanger(); 
    }
    else if($(this).attr('id')==='lastrecord')
    { 
    document.getElementById('recordnames').selectedIndex=db.maxRecords-1
    recordChanger(); 
    }
    else{return}
    }); 
    }//end of tableChange()
    function refreshTables()
    {
    pathChangeCleanUp();
    $('#tablecount').text('Tables:');
    db.closeDB(); //close connection string, recordset, and catalog of tables 
    var strPath=$('#datapath').val();
    var filename = strPath.replace(/^.*\\/, '');
    $('#filename').text(filename);
    $('#pathname').html('&nbsp;&nbsp;'+strPath);
    var dbasePath=document.getElementById('datapath').value; //specifies the path of the database file ;
    var query ='';
    //document.getElementById('fieldnames').innerHTML='' //Clear ou the old field names-> NOT ANY MORE
    db.openDB(dbasePath, query); //* Open the database with no query


    if(dbasePath!==null && dbasePath!=='') // maybe 'null' should be replaced by 'undefined.'// 
    {
    var objDivTables=document.getElementById('divtables');
    //clear out the drop box and re-create it to start fresh in size and content
    objDivTables.innerHTML='';
    objDivTables.innerHTML='<select id="tablenames" style="width: 180px"></select>';
    // put them in a dropdown list.    
    var strTablePrompt='____Choose a Table___'
    var i=0;
    var objOption = document.createElement("option"); // our first dropdown option ... 
    objOption.value = ""+i;
    objOption.id="table"+i;
    objOption.text = strTablePrompt; 
    document.getElementById('tablenames').add(objOption,i); //... is the prompt string
    for (var i=0;i<db.tableNames.length;i++) // loop through all the table names
    {
    var objOption = document.createElement("option"); 
    objOption.value = ""+(i+1);
    objOption.id="table"+(i+1);
    objOption.text = db.tableNames[i]; // the "i-th" table name goes int the ...
    document.getElementById('tablenames').add(objOption,(i+1)); // ... "i-th plus 1 option spot ...
    //... because the prompt string got the first spot and 'bumped' the others up 
    //alert('objDivTables.innerHTML :'+objDivTables.innerHTML);
    }
    //alert('objDivTables.innerHTML :'+objDivTables.innerHTML);
    //document.getElementById('tablecount').text=rs.tableNames.length+' tables'; 
    var phr = sngPlr(db.tableNames.length,'Table') 
    $('#tablecount').text(phr+':');
    // If only one table, show the records, otherwise prompt to choose a table
    if(db.tableNames.length===1){
    document.getElementById("tablenames").selectedIndex=1;
    tableChange();
    document.getElementById('recordnames').focus();
    }
    else{document.getElementById('tablenames').focus();}
    }
    }//end of refreshTables()
};//end of datapath change handler
   });//end of document-ready 
//.................................