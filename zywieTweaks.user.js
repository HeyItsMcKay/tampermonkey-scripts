// ==UserScript==
// @name         ZywieTweaks JS
// @version      1.0
// @description  Make some of the actions on the website I use at work more poweruser friendly (Keyboard commands are our friends)
// @author       McKay
// @match        *://app.zywie.net/tech*
// @grant        none
// ==/UserScript==

(function() {
    var findOffsetInterval, findAddBeat;
    var onsetDiv, caliperDiv, handlePathList, addBeatList, handleIndex, mostRecentHandle, addBeatToClick, ecgArea;
    var handlePathListLength = 0;
    var eventPage = /events\/(event|ratechange)detail*/;
    console.log("ZTJS Loaded");
    //Start watching for the page to change and look for the event page when it does
    window.addEventListener("hashchange",function(){
        //Stop any loops that might be going
        clearInterval(findOffsetInterval);
        clearInterval(findAddBeat);
        //And forget which type of ecg page we were on
        ecgArea = undefined;
        //If we're on an ECG page then start the process back up
        if(eventPage.test(location.hash)) foundEvent();
    })
    //Add the keyboard listener to do things when the keyboard is touched
    document.addEventListener("keydown",function(e){
        //Add a beat to the strip when the space bar is pressed
        if(e.keyCode === 32 && addBeatToClick){
            e.preventDefault();
            //console.log(addBeatToClick)
            addBeatToClick.__onclick();

        //Change an existing beat to a different interpretation
        } else if(document.getElementById(ecgArea + "_0_change2Normal")) {
            switch(String.fromCharCode(e.keyCode)){
                //There are multiple types of ECG pages, and each one has a different prefix for the element ID names, which where 'ecgArea' comes in.
                case "N": document.getElementById(ecgArea + "_0_change2Normal").click(); break;
                case "V": document.getElementById(ecgArea + "_0_change2PVC").click(); break;
                case "A": document.getElementById(ecgArea + "_0_change2PAC").click(); break;
                case "F": document.getElementById(ecgArea + "_0_change2Artifact").click(); break;
                case "R": document.getElementById(ecgArea + "_0_removeBeat").click() ; break;
                case "": document.getElementById(ecgArea + "_0_noChange").click(); break; //Escape key
            }
        }
    })

    //When first loaded, do an initial check to see if we're on an event page
    if(eventPage.test(location.hash)) foundEvent();
    //When we find the event page
    function foundEvent(){
        //Start looking for the offset bar 5 times a second
        findOffsetInterval = setInterval(function(){
            var success = false;
            try {
                //If we can find the onset_dragger_div and its grandchildren, then we can move on
                document.getElementsByClassName("onset_dragger_div")[0].children[0].children;
                success = true;
            } catch(e){}
            if(success) foundOffset();
        }, 200);
    }
    //When we find the offset bar on the event page
    function foundOffset(){
        //Stop looking for the offset bar
        clearInterval(findOffsetInterval);
        //Set the 'ecgArea' value specific to the current type of ECG page
        ecgArea = document.querySelector('[id^="ecgarea"]').id;
        //Start looking for a beat add bar five times a second
        findAddBeat = setInterval(function(){
            //Grab a list of everything from the bar below the heartbeat strip
            onsetDiv = Array.from(document.getElementsByClassName("onset_dragger_div")[0].children[0].children);
            //and from the bar above
            caliperDiv = Array.from(document.getElementsByClassName("caliper_area")[0].children[0].children);
            //Grab only the add beat handles from the bottom list
            handlePathList = onsetDiv.filter(obj => {return obj.localName === "path"})
                .filter(obj => {return obj.attributes.stroke.value === "#F781D8"})
            //Grab only the 'add beat' buttons from the top list
            addBeatList = caliperDiv.filter(obj => {return obj.localName === "path"})
                .filter(obj => {return obj.nextElementSibling.textContent === "Set New Beat"})
            //Has the number of beat bars changed?
            if(handlePathList.length != handlePathListLength){
                //If it has gone up, run the next part of code
                if (handlePathList.length > handlePathListLength) foundNewAddBeat();
                //And update the number of beat bars regardless
                handlePathListLength = handlePathList.length
            }
        }, 200);
    }
    //When we find a beat add bar
    function foundNewAddBeat(){
        //Collect all the parts of the last beat add handle in the offset div list ('path' and next five 'lines')
        handleIndex = onsetDiv.findIndex(function(e){return e === handlePathList[handlePathList.length-1]});
        mostRecentHandle = onsetDiv.slice(handleIndex, handleIndex + 5);
        //and assign them event handlers for being clicked.
        var i;
        for(i = 0; i < mostRecentHandle.length; i++){
            //Bind the identity of the handle's 'path' to the function that is called when clicked
            mostRecentHandle[i].addEventListener("mousedown", clickDownBeatBar.bind(mostRecentHandle[0]));
            //We don't need to know which handle we aren't clicking anymore, so don't bind this one
            mostRecentHandle[i].addEventListener("mouseup", clickUpBeatBar);
        }
    }

    //When a beat bar is clicked
    function clickDownBeatBar(){
        var searchedPath = this;
        //Find the index of the current handle in the handles list
        //And set 'addBeatToClick' as the corresponding add beat button in the add beat buttons list
        addBeatToClick = addBeatList[handlePathList.findIndex(function(e){return e === searchedPath})];
    }
    //When a beat bar is unclicked
    function clickUpBeatBar(){
        //Unset the active button
        addBeatToClick = undefined;
    }
})();
