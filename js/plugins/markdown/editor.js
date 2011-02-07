

function markdownEditor(el){
    var obj = this;
    this.el = el;
    // history
    this.forward = 0;
    this.back = 0;
    this.store = [];
    obj.history();
    // end history

    // link tab function
    obj.linkTabInit();
    //end link tab function

    // list inter function
    obj.listInterInit();
    //end list inter function

    // \r symbol test
    obj.isDosTextSet();
}

markdownEditor.prototype = {
    // history
    history: function(){
        var obj = this,
            area = obj.el,
            lastVal = area.value,
            val,
            storeVal,
            box = $(area).parents('div.pencase-content').get(0) || $('body').get(0),
            interval;

        //store initial textarea value
        obj.store[0] = { text: area.value };
        setTimeout(function(){
            obj.store[0] = { text: area.value };    
        }, 700);


        $(area).keyup(function(){
            //obj.storePush();
            obj.back = 0;
        });

        var interval = setInterval(function(){
            var flag = jQuery.contains(box,  area);
            if(!flag){
                clearInterval(interval);
            } else{
                val = area.value;
                storeVal = obj.store[obj.store.length - 1];
                if( lastVal == val
                        && val !=storeVal
                        && obj.back == 0 ){
                    obj.storePush();
                }
                lastVal = area.value;
            }
        }, 1000);
    },
    storePush: function(){
        var obj = this,
            area = obj.el,
            text = area.value,
            lastText = obj.store[obj.store.length - 1].text;
        if( $.trim(text) != $.trim(lastText) ){
            var data = {text:text},
                scroll = $(area).scrollTop(),
                selPos = obj.getSelectedPos();
            data.scroll = scroll;
            data.selPos = selPos;
            obj.forward++;
            obj.store[obj.forward] = data;
            obj.back = 0;
            var l = obj.store.length;
            var max = 20; //20
            if( l > max ){
                obj.store = obj.store.slice( l - max, l );
                obj.forward -= l - obj.store.length;
            }
            //console.warn(obj.store);
        }
    },
    storeGet: function(data){
        var obj = this,
            area = obj.el;
        if(data){
            if(data.text){
                area.value = data.text;
            }
            if(data.text ==''){
                area.value = '';
            }
            if(data.scroll){
                $(area).scrollTop(data.scroll);
            }
            if(data.scroll == 0){
                $(area).scrollTop(0);    
            }
            if(data.selPos){
                obj.setSelection(data.selPos.start, data.selPos.end);
            }
        }
    },
    undo: function(){
        var obj = this,
            area = obj.el,
            l = obj.store.length,
            back = obj.back;
        // save last value if not save
        if(back == 0 && obj.store[l] != area.value){
            obj.storePush();
            l = obj.store.length;
            back = 0;
        }

        if( obj.back <= obj.forward ){
            obj.back++;
        } else {}
        l = l - obj.back;
        if (obj.store[l]) {
            obj.storeGet( obj.store[l] );
        } else {
            obj.storeGet( obj.store[0] );
        }
        if(back == 0){ obj.undo(); }
    },
    redo: function(){
        var obj = this,
            area = obj.el,
            l = obj.store.length;
            if(obj.back > 1){
                obj.back--;
            } else {}
            l = l - obj.back;
            if(obj.store[l]){
                obj.storeGet( obj.store[l] );
            } else {
                obj.storeGet( obj.store[0] );
            }
    },
    // end history

    simpleWrap: function(prefix, suffix, label){
        prefix ? prefix : '';
        suffix ? suffix : '';

        var selText =  this.getSelectedText(),
            isEmpty;
        if(!selText.length && label){
            selText = label;
            isEmpty = true;
        }
        var start = this.getCaretPos(),
            end = start + selText.length,
            startSel = start,
            tagTest = this.tagTest(selText, startSel, prefix, suffix),
            newText ='',
            endSel = 0;

        if(isEmpty){
            end = start;
        }

        //console.warn(selText +' - '+ label);
        if(tagTest == 'outside'){
            newText = selText;
            start -= prefix.length;
            end += suffix.length;

            startSel = start;
            endSel = end - prefix.length - suffix.length;
        } else if(tagTest == 'inside'){
            newText = selText.substring(prefix.length, selText.length - suffix.length );
            endSel = startSel + newText.length;
        } else{
            newText = prefix + selText + suffix;
            endSel = startSel + newText.length - suffix.length;
            startSel += prefix.length;
        }
        //console.warn('newText - '+ newText +' || start - '+ start +' || end -'+ end);
        this.insertText(newText, start, end);
        this.setSelection(startSel, endSel);



    },
    getSelectedText: function(){
        var text = "",
            area = this.el;
        if (document.getSelection){
            var start = area.selectionStart,
                end = area.selectionEnd;
            text = area.value.substring(start, end);
        } else {
            var text = document.selection.createRange().text;
            var obj = document.selection.createRange();
        }
        return( text );
    },
    getSelectedPos: function(){
        var obj = this,
            start = obj.getCaretPos(),
            selText = obj.getSelectedText(),
            end = start + selText.length;
        return {
            start: start,
            end: end
        }
    },
    tagTest: function(text, start, prefix, suffix){
        var area = this.el,
            wrapText = area.value.substring(start - prefix.length, start + text.length + suffix.length ),
            startWrap = wrapText.substring(0, prefix.length),
            endWrap = wrapText.substring(wrapText.length - suffix.length, wrapText.length),
            startText = text.substring(0, prefix.length),
            endText = text.substring(text.length - suffix.length, text.length);
        if( startWrap == prefix && endWrap == suffix && wrapText != text ){
            return 'outside';
        } else if( startText == prefix && endText == suffix){
            return 'inside';
        } else {
            return false;
        }
    },
    insertText: function(text, start, end){
        //alert(start+' - '+end);
        var obj = this,
            area = obj.el,
            $area = $(area),
            scroll = $area.scrollTop();
        area.value = area.value.substring(0, start)+ text + area.value.substring(end, area.value.length);
        $area.scrollTop(scroll);

        obj.back = 0; // for history
    },
    setSelection: function(start, end){
        //alert(start +' - '+ end);
        var obj = this,
            area = this.el;
        $(area).focus();
        if (document.getSelection){
                area.setSelectionRange(start, end);
        } else if(area.createTextRange()){
            //$(area).blur().focus();
            var text = area.value,
                startText = text.substring(0, start),
                startIefix  = startText.length - obj.crossText(startText).length,
                endText = text.substring(0, end),
                endIefix  = endText.length - obj.crossText(endText).length;
            area.focus();
            var range = area.createTextRange();
            range.collapse();
            range.moveEnd('character', end - endIefix);
            range.moveStart('character', start - startIefix);
            range.select();
        }
    },
    setTrimSelection: function(start, text, startShift, endShift){
        var obj = this,
            startShift = startShift || 0,
            endShift = endShift || 0,
            text = obj.crossText(text),
            LtrimText = obj.trimLeft(text),
            Lspace = text.substring(0, text.length - LtrimText.length),
            trimText = $.trim(text),
            start = start + Lspace.length,
            end = start + trimText.length;

        if( obj.isDosText ){// for opera
            var leftFix = Lspace.length - obj.clearLineFeeds(Lspace).length;
            start += leftFix;
            end += ( leftFix + ( trimText.length - obj.clearLineFeeds(trimText).length ) );
        }

        obj.setSelection(start + startShift , end + endShift);
    }, 
    getCaretPos: function(){
        var obj = this,
            area = this.el,
            result = 0;
        area.focus();
        if (document.selection) { // IE
            var sel = document.selection.createRange(),
                clone = sel.duplicate(),
                value = area.value;
            sel.collapse(true);
            clone.moveToElementText(area);
            clone.setEndPoint('EndToEnd', sel);
            var afterText = value.substring(clone.text.length, value.length), 
                Iefix  = afterText.length - obj.trimLeft( afterText ).length;
            if( $.trim(afterText).length == 0){
                Iefix = 0;    
            }
            result = clone.text.length + Iefix;
        } else if (obj.selectionStart !== false){// Gecko
            result = area.selectionStart;
        }
        return result;
    },

    // LINK

    // link tab function
    linkTabInit: function(){
        var obj = this,
            area = $(obj.el);
        function tabChange(e){
            if(e.which == 9){
                obj.createLinkTabChange(e);
            }
        }
        if(!$(area).data('tabChange')){
            $(area).bind('keydown', tabChange)
                   .data('tabChange', true)
                   .keypress(function(e){ // for opera
                        if(e.which == 9){
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    });
        }
    },
    createLinkTabChange: function(e){
        var obj = this;
        function stopEvent(e){
            e.preventDefault();
            e.stopPropagation();
        }
        // in link test
        var testObj = obj.inLinkTest(),
            testType;
        if(testObj){
            stopEvent(e);
            testType = testObj.type;
            //console.warn(testType);
            if( testType == 'wrapAnchor' || testType == 'inAnchor' ){
                obj.setSelection(testObj.urlStart, testObj.urlEnd);
            } else if( testType == 'wrapUrl' || testType == 'inUrl' ){
                obj.setSelection(testObj.anchorStart, testObj.anchorEnd);
            }
        }
    },
    //end link tab function

    getLinkList: function(){
        var obj = this,
            reg = /(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?(.*?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,
            str = obj.el.value,
            arr = [];
        while ((myArray = reg.exec(str)) != null) {
            var text = myArray[0],
                end = reg.lastIndex,
                start = end - text.length,
                paths = text.substring(1, text.length-1).split(']('),
                anchor = paths[0],
                anchorStart = start + 1,
                anchorEnd = anchorStart + anchor.length,
                url = paths[1],
                urlStart = anchorEnd + 2,
                urlEnd = urlStart + url.length;
            arr.push({
                text: text,
                start: start,
                end: end,
                // link text
                anchor: anchor,
                anchorStart: anchorStart,
                anchorEnd: anchorEnd,
                // link url
                url: url,
                urlStart: urlStart,
                urlEnd: urlEnd
            });
        }
        //console.warn(arr);
        return arr;

    },
    inLinkTest: function(){
        var obj = this,
            start = obj.getCaretPos(),
            selText =  obj.getSelectedText(),
            end = start + selText.length,
            arr = obj.getLinkList(),
            flag;
        for(var x=0, l=arr.length; x<l; x++){
            var data = arr[x];
            if(start <= data.start && end >= data.end){
                flag = 'wrapText';
            } else if(end > data.start && end < data.end && start < data.start){
                flag = 'inText';
            } else if( start > data.start && start < data.end){
                flag = 'inText';
                if( selText == data.anchor && start == data.anchorStart){
                    flag = 'wrapAnchor';
                } else if( start >= data.anchorStart && start <= data.anchorEnd){
                    flag = 'inAnchor';
                } else if ( selText == data.url && start == data.urlStart ){
                    flag = 'wrapUrl';
                } else if( start >= data.urlStart && start <= data.urlEnd ){
                    flag = 'inUrl';
                }
            }
            if(flag){
                return $.extend({type: flag}, data);
            }
        }
    },
    linkLabel: 'link text',
    linkUrlLabel: 'http://example.ru/', 
    createLink: function(linkUrl, linkText, linkTitle){
        var obj = this,
            area = obj.el,
            selText =  obj.getSelectedText(),
            linkText = selText ? selText : linkText, 
            prefix = '[',
            linkTitleCode = '',
            label = obj.linkLabel,
            urlLabel = linkUrl ? linkUrl : obj.linkUrlLabel;
        if(linkTitle){
            var linkTitleCode = ' "'+ linkTitle +'"';
        }
        var suffix = ']('+ urlLabel + linkTitleCode + ')';

        // in link test
        var testObj = obj.inLinkTest(),
            testType;
        if(testObj){ testType = testObj.type; }
        //console.warn(testType);
        // END in link test

        switch (testType) {
            case 'wrapText':
                wrapText();
            break
            case 'wrapAnchor':
                wrapAnchor();
            break
            case 'inAnchor':
                inAnchor();
            break
            case 'inText':
                inAnchor();
            break
            case 'wrapUrl':
                wrapUrl();
            break
            case 'inUrl':
                inUrl();
            break
            default:
                defaultWrap();
        }

        function wrapText(){

        }
        function  wrapAnchor(){
            if(testObj.anchor == label){
                obj.insertText('', testObj.start, testObj.end);
                obj.setSelection(testObj.start, testObj.start);
            } else {
                obj.insertText(testObj.anchor, testObj.start, testObj.end);
                obj.setSelection(testObj.start, testObj.start + testObj.anchor.length);
            }
        }
        function inAnchor(){
            obj.setSelection(testObj.anchorStart, testObj.anchorEnd);
        }
        function wrapUrl(){
            if(selText == urlLabel){
                obj.insertText(testObj.anchor, testObj.start, testObj.end);
                obj.setSelection(testObj.start, testObj.start + testObj.anchor.length);
            }
            inAnchor();
        }
        function inUrl(){
            obj.setSelection(testObj.urlStart, testObj.urlEnd);
        }
        function defaultWrap(){
            if(linkText.length){
                var start = obj.getCaretPos(),
                    end = start + selText.length,
                    startSel = start + 1,
                    newText = prefix + linkText + suffix,
                    endSel = startSel + linkText.length;
                obj.insertText(newText, start, end);
                obj.setSelection(startSel, endSel);

            } else {
                obj.simpleWrap(prefix, suffix, label);
            }
        }
    },

    // END LINK

    // list
    listLabel: 'list item',
    crossText: function(text){
        // Standardize line endings
        text = text.replace(/\r\n/g,"\n"); // DOS to Unix
        //text = text.replace(/\r/g,"\n"); // Mac to Unix
        return text;
    },
    isDosText: false,
    isDosTextSet: function(){
        var obj = this,
            flag = false,
            area = $('<textarea>www\n\nhhh</textarea>').get(0),
            text = area.value;
            if( (text.length - obj.crossText( text ).length) > 0 ){
                obj.isDosText = true;
                area = null;
            }
    },
    trimLeft: function(text){
        var text = text || '';
        return text.replace( /^\s+/, "" );
    },
    trimRight: function(text){
        var text = text || '';
        return text.replace( /\s+$/, "" );
    },
    clearLineFeeds: function(text){
        return text.replace(/\n/gim, '');        
    },
    positionFix: function(start){
        var obj = this,
            area = obj.el,
            text = area.value.substring(0, start),
            fix = text.length - obj.crossText(text).length;

        //obj.console( result +' - '+ fix + ' - ' + (start - fix) );

        return parseInt( fix );
    },
    getULList: function(){
        var obj = this,
            reg = /^(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*?(?:[*+-]|\d+[.])[ \t]+)))/gim,
            //reg = /^(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?((\s*|\S*)|\n{2,}(?=\S)(?![ \t]*?(?:[*+-]|\d+[.])[ \t]+)))/gim,
            str = obj.crossText( obj.el.value ),
            arr = [],
            index = 0,
            areaVal = obj.el.value;
        str = str + '\n\nw'; // one list fix
        while ((myArray = reg.exec(str)) != null) {
            var text = myArray[0],
                trimText = $.trim(text),
                trimRightText = obj.trimRight(text),
                rightSpaces = text.substring( ( text.length - (text.length - trimRightText.length) ), text.length),
                end = reg.lastIndex,
                beforeText = str.substring(0, end),
                fixFlag = obj.isDosText,
                posFix  = fixFlag > 0 ? ( beforeText.length - obj.clearLineFeeds(beforeText).length ) : 0,
                type = ( (text+ "-").search(/[*+-]/gim) > 0 ) ? "ol" : "ul";

            end += posFix;
            end -= rightSpaces.length;
            if(fixFlag){
                end -= ( rightSpaces.length - obj.clearLineFeeds(rightSpaces).length );
            }

            var start = end - trimText.length;
            if(fixFlag){
                start -= ( trimText.length - obj.clearLineFeeds(trimText).length ) ;    
            }
            var elements = obj.getULListItems(trimText, start, fixFlag);
            arr.push({
                index: index++,
                type: type,
                text: trimText,
                start: start,
                end: end,
                elements: elements
            });
        }
        return arr;
    },
    getULListItems: function( text, startPos, fixFlag){
        var obj = this,
            areaVal = obj.el.value,
            arr = [],
            index = 0,
            shift = startPos;
        function getListItem(textStr){
            var subText,
                //reg = /(\n)?(^[ \t]*)([*+-]|\d+[.])[ \t]+([^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[ \t]+))/gim,
                reg =  new  RegExp('(\\n)?(^[ \\t]*)([*+-]|\\d+[.])[ \\t]+([^\\r]+?(\\n{1,2}))(?=\\n*(~0|\\2([*+-]|\\d+[.])[ \\t]+))', 'gim'), // important in constructor
                fix = '\n- www\n',
                textStr = textStr + fix,
                myArray = reg.exec(textStr),
                subText = '';
            if(myArray){
                var str = myArray[0],
                    trimText = $.trim(str),
                    trimRightText = obj.trimRight(str),
                    rightSpaces = str.substring( ( str.length - (str.length - trimRightText.length) ), str.length),
                    end = reg.lastIndex + shift,
                    posFix  = ( str.length - obj.clearLineFeeds(str).length );

                end -= rightSpaces.length;
                if(fixFlag){ // for Opera and IE
                    end += posFix;
                    end -= ( rightSpaces.length - obj.clearLineFeeds(rightSpaces).length );
                }

                var start = end - trimText.length,
                    subText = textStr.substring(reg.lastIndex, textStr.length - fix.length) || '',
                    cleanText = trimText.replace(new  RegExp('(^[*+-]|^\\d+[.])(\\s+)'), ''); // important in constructor
                shift += reg.lastIndex;
                if(fixFlag){ // for Opera and IE
                    shift += posFix;
                    start -= ( trimText.length - obj.clearLineFeeds(trimText).length );
                }
                arr.push({
                    text: cleanText,
                    start: start,
                    textStart: parseInt(start) + ( parseInt(trimText.length) - parseInt(cleanText.length) ),
                    end: end,
                    index: index++
                });
            }

            // Recursion for sub-lists
            if(subText && subText.length > 2){
                getListItem(subText);
            }
        } getListItem(text);
        return arr;
    },
    inListTest: function(){
        var obj = this,
            text = obj.el.value,
            start = obj.getCaretPos(),
            selText =  obj.getSelectedText(),
            end = start + selText.length,
            arr = obj.getULList(),
            flag;

        for(var x=0, l=arr.length; x<l; x++){
            var data = arr[x],
                nextData = arr[x+1] || null;

            if( start <= data.start && end >= data.end ){
                flag = 'wrapList';
            } else if( nextData && $.trim( text.substring(data.end,  nextData.start) ).length == $.trim( selText ).length
                    && (start >= data.end && end <= nextData.start ) ){
                flag = 'betweenLists';
            } else if( end <= (data.start + 1) && $.trim(text.substring(end, data.start)).length < 1 ){
                flag = 'beforeList';
            } else if( start >= data.end && $.trim(text.substring(start, data.end)).length < 1 ){
                flag = 'afterList';
            }

            if(flag){
                 return $.extend({typePos: flag}, data);
            } else{
                var itemsData = inListItemsTest(data.elements);
                if(itemsData){
                    return itemsData;
                }
            }
        }

        function inListItemsTest(arr){
            var itemsFlag;
            // check for "betweenitems" value
            var itemsCount = 0;
            for(var x=0, l=arr.length; x<l; x++){
                var item = arr[x];
            }

            for(var x=0, l=arr.length; x<l; x++){
                var item = arr[x],
                    nextItem = arr[x+1] || null;
                if( (start == end) && (start == item.start || end == item.end || ( nextItem && start > item.end && end < nextItem.start ) ) ){
                    if(start == item.start){
                        itemsFlag = 'betweenItems';
                    } else{
                        itemsFlag = 'betweenItems2';
                    }
                } else if ( start <= item.textStart  && end  >= item.end ){
                    itemsFlag = 'wrapItem';
                } else if( (start > item.start && end < item.end) || (start >= item.start && end <= item.end && start != end ) ){
                    itemsFlag = 'inItem';
                }
                if(itemsFlag){
                    return {
                                list: data,
                                item: item,
                                typePos: itemsFlag
                           };
                }
            }
        }
    },
    createList: function(listType){
        var obj = this,
            area = obj.el,
            selText =  obj.getSelectedText(),
            listType = listType || 'ul',
            label = obj.listLabel;

        // in list test
        var testObj = obj.inListTest(),
            testType;

        if(testObj){ testType = testObj.typePos; }

        //obj.console(testType);

        // END in link test

        switch (testType) {
            case 'wrapList':
                wrapList();
            break            
            case 'beforeList':
                beforeList();
            break
            case 'afterList':
                afterList();
            break
            case 'betweenLists':
                betweenLists();
            break
            case 'inItem':
                inItem();
            break
            case 'betweenItems':
                betweenItems();
            break
            case 'betweenItems2':
                betweenItems(1);
            break
            case 'wrapItem':
                wrapItem();
            break
            default:
                defaultAction();
        }

        function inItem(){
            var listObj = testObj.list,
                itemObj = testObj.item,
                itemArr = listObj.elements,
                index = parseInt(itemObj.index) ,
                beforeArr = itemArr.slice(0, index),
                afterArr = itemArr.slice(index + 1, itemArr.length),
                start = obj.getCaretPos(),
                end = start + selText.length,
                newItems = [],
                newArr = [],
                inTextPos;
            if( start >= itemObj.start && end <= itemObj.textStart ){ // {3. }list item
                newItems.push({ text: label });
                newItems.push(itemObj);
            } else if( (!selText.length || !$.trim( area.value.substring(start, end) ).length ) && start >  itemObj.textStart && end < itemObj.end ){ // 3. li{}st i{}tem
                inTextPos = start - itemObj.textStart;
                newItems.push({ text: itemObj.text.substring(0, inTextPos) });
                newItems.push({ text: itemObj.text.substring(inTextPos, itemObj.text.length) });
                index++;
            } else if(selText.length && ( start >= itemObj.start && start <=  itemObj.textStart) && end < itemObj.end ){ // 3. {lis}t item || 3{. lis}t item
                inTextPos = end - itemObj.textStart;
                newItems.push({ text: itemObj.text.substring(0, inTextPos) });
                newItems.push({ text: itemObj.text.substring(inTextPos, itemObj.text.length) });
            } else if(selText.length && start >= itemObj.start && end == itemObj.end ){ // 3. list it{em}
                inTextPos = start - itemObj.textStart;
                newItems.push({ text: itemObj.text.substring(0, inTextPos) });
                newItems.push({ text: itemObj.text.substring(inTextPos, itemObj.text.length) });
                index++;
            } else if(selText.length && start > itemObj.start && end < itemObj.end ){ // 3. lis{t it}em
                var inTextPosStart = start - itemObj.textStart,
                    inTextPosEnd = inTextPosStart + selText.length;
                newItems.push({ text: itemObj.text.substring(0, inTextPosStart) });
                newItems.push({ text: selText });
                newItems.push({ text: itemObj.text.substring(inTextPosEnd, itemObj.text.length) });
                index++;
            }

            if(!newItems.length){ return; }
            newArr = $.merge( beforeArr, newItems );
            newArr = $.merge( newArr, afterArr );
            var list = obj.createListCode( newArr, listType );
            // insert new list
            obj.insertText( list, listObj.start, listObj.end);
            // set selection new item
            obj.setListItemSelection(listObj.index, index);
        }

        function betweenItems(shift){
            var shift = parseInt(shift ? shift : 0),
                listObj = testObj.list,
                itemObj = testObj.item,
                itemText = $.trim( selText.length ? selText : label ),
                itemArr = listObj.elements,
                index = parseInt(itemObj.index) + shift ,
                beforeArr = itemArr.slice(0, index),
                afterArr = itemArr.slice(index, itemArr.length),
                item = {
                    text: itemText
                },
                newArr = $.merge( beforeArr, [item] );
            newArr = $.merge( newArr, afterArr );
            var list = obj.createListCode( newArr, listType );
            // insert new list
            obj.insertText( list, listObj.start, listObj.end);
            // set selection new item
            obj.setListItemSelection(listObj.index, index);
        }

        function wrapList(){
            //console.warn(testObj);
            var start = testObj.start,
                end = testObj.end,
                text = '';
            if(testObj.type == listType){
                text = obj.getTextFromListItems(testObj.elements);
            } else {

                text = obj.createListCode( testObj.elements, listType );
            }            
            // insert new text
            obj.insertText( text, start, end);
            // set selection new list
            obj.setTrimSelection(start, text);

        }

        function beforeList(){
            //console.warn(testObj);
            var itemText = $.trim( selText.length ? selText : label ),
                itemArr = testObj.elements,
                items = obj.getListItemsFromText(itemText),
                list = obj.createListCode( $.merge(items, itemArr), listType),
                start = obj.getCaretPos(),
                beforeText = area.value.substring(0, start),
                spaceFix = beforeText.length - obj.trimRight( beforeText ).length,
                brs = $.trim( beforeText ).length ? '\n\n': '';
            start -= spaceFix;
            // insert new list
            obj.insertText( list, testObj.start, testObj.end);
            // del old text
            obj.insertText( brs, start, testObj.start);
            // set selection new item
            obj.setListItemSelection(testObj.index, 0);
        }

        function afterList(){
            var itemText = $.trim( selText.length ? selText : label ),
                itemArr = testObj.elements,
                items = obj.getListItemsFromText(itemText),
                list = obj.createListCode( $.merge(itemArr, items), listType ),
                end = obj.getCaretPos() + selText.length,
                afterText = area.value.substring(end, area.value.length),
                spaceFix = afterText.length -  obj.trimLeft( afterText ).length;
            // del old text
            obj.insertText( '', testObj.end, end );
            // insert new list
            obj.insertText( list + '\n\n', testObj.start, testObj.end + spaceFix);
            // set selection new item
            obj.setListItemSelection(testObj.index, itemArr.length - 1);
        }

        function betweenLists(){
            //console.warn(testObj);
            var itemText = $.trim( selText.length ? selText : label ),
                index = parseInt( testObj.index ),
                listArr = obj.getULList(),
                nextTestObj = listArr[index+1] || null,
                areaStart = testObj.start,
                areaEnd = nextTestObj.end,
                itemArr = testObj.elements,
                itemIndex = itemArr.length,
                nextItemArr,
                items = obj.getListItemsFromText(itemText),
                newArr = $.merge( itemArr, items ),
                list;
            if(!nextTestObj){ return; }
            nextItemArr = nextTestObj.elements;
            newArr = $.merge(newArr, nextItemArr);
            // create merge list
            list = obj.createListCode( newArr, listType );
            // insert new list
            obj.insertText( list, areaStart, areaEnd);
            // set selection old item
            obj.setListItemSelection(index, itemIndex);
        }

        function wrapItem(){
            var listObj = testObj.list,
                itemObj = testObj.item,
                itemArr = listObj.elements,
                index = parseInt(itemObj.index);
            if(listObj.type == listType){
                var beforeArr = itemArr.slice(0, index),
                    afterArr = itemArr.slice(index + 1, itemArr.length),
                    beforeList = obj.createListCode( beforeArr, listType ),
                    afterList = obj.createListCode( afterArr, listType ),
                    text = area.value,
                    beforeText = text.substring(0, listObj.start),
                    beforeFix = beforeText.length - obj.trimRight(beforeText).length,
                    tbrs = $.trim(beforeText).length ? '\n\n' : '',
                    resultText = tbrs + $.trim( beforeList + '\n\n' + itemObj.text + '\n\n' + afterList ) + '\n\n',
                    afterText = text.substring(listObj.end, text.length),
                    afterFix = afterText.length - obj.trimLeft(afterText).length;
                // insert new text
                var pasteStart = listObj.start - beforeFix,
                    pasteEnd = listObj.end + afterFix;
                obj.insertText( resultText, pasteStart, pasteEnd);

                // set selection new paragraph
                var beforeStr = obj.trimRight( tbrs + $.trim( beforeList ) ) + '\n\n',
                    fixFlag = obj.isDosText, // for Opera and IE
                    selStartFix = fixFlag > 0 ? ( beforeStr.length - obj.clearLineFeeds(beforeStr).length ) : 0,
                    selStart = pasteStart + beforeStr.length + selStartFix;
                if( !($.trim(beforeText).length > 0) && ( itemObj.index == 0 ) ){
                    if(fixFlag){
                        selStart -= 4; // opera
                    } else {
                        selStart -= 2;
                    }
                }
                var selEndFix = fixFlag > 0 ? ( itemObj.text.length - obj.clearLineFeeds(itemObj.text).length ) : 0,
                    selEnd = selStart + itemObj.text.length + selEndFix;
                obj.setSelection( selStart, selEnd );
            } else {
                // insert new list
                obj.insertText( obj.createListCode( listObj.elements, listType ), listObj.start, listObj.end);
                // set selection old item
                obj.setListItemSelection(listObj.index, index);
            }
        }

        function defaultAction(){
            var start = obj.getCaretPos(),
                end = start + selText.length,
                itemText = $.trim( selText.length ? selText : label ),
                items = obj.getListItemsFromText(itemText),
                list = obj.createListCode( items, listType ),
                text = area.value,
                beforeText = text.substring(0, start),
                afterText = text.substring(end, text.length),
                beforeFix = beforeText.length - obj.trimRight( beforeText ).length,
                afterFix = afterText.length - obj.trimLeft( afterText ).length,
                tBr = $.trim( beforeText ).length ? '\n\n' : '',
                newText = tBr + list + '\n\n';
            start -= beforeFix;
            end += afterFix;
            // insert new list
            obj.insertText(newText, start, end);
            // set selection new item
            if(items.length > 1){
                obj.setTrimSelection(start, newText);
            } else {
                var startFix = list.length -  $.trim( list.substring(2, list.length) ).length;
                obj.setTrimSelection(start, newText, startFix);
            }
        }

    },
    getListItemsFromText: function(text){
        var obj = this,
            text = obj.crossText(text),
            arr = text.split('\n'),
            items = [];
        for(var x=0, l = arr.length; x<l; x++){
            var str = $.trim( arr[x] );
            if(str.length){
                items.push({text: str});
            }
        }
        return items;
    },
    getTextFromListItems: function(arr){
        var obj = this,
            text = '';
        for(var x=0, l = arr.length; x<l; x++){
            var str = $.trim( arr[x].text );
            text += str + '\n';
        }
        return $.trim( text );
    },
    setListItemSelection: function(listPos, itemPos){
        var obj = this,
            arr = obj.getULList(),
            item;
        if(arr && arr[listPos] && arr[listPos]['elements'][itemPos]){
            item = arr[listPos]['elements'][itemPos];
            obj.setSelection(item.textStart, item.end);
        }

    },
    createListCode: function(items, type){
        var text ='';
        for(var x = 0, l = items.length; x<l; x++){
            var item = items[x],
                prefix = '- ';
            if(type == 'ol'){
                prefix = (x + 1) + '. ';
            }
            text += prefix + $.trim( item.text ) + '\n';
        }
        return $.trim(text);
    },

    // list inter function
    listInterInit: function(){
        var obj = this,
            area = $(obj.el);
        function interChange(e){
            if(e.which == 13){
                obj.createListInterChange(e);
            }
        }
        function ddd(){};
        if(!$(area).data('interChange')){
            $(area).bind('keypress', interChange)
                   .data('interChange', true);
        }
    },
    createListInterChange: function(e){
        var obj = this,
            area = obj.el,
            selText =  obj.getSelectedText(),
            label = obj.listLabel;
        
        function stopEvent(e){
            e.preventDefault();
            e.stopPropagation();
        }
        // in link test
        var testObj = obj.inListTest(),
            testType = testObj ? testObj.typePos : null;

        function betweenItems(shift){
            var shift = parseInt(shift ? shift : 0),
                listObj = testObj.list,
                itemObj = testObj.item,
                itemText = $.trim( selText.length ? selText : label ),
                itemArr = listObj.elements,
                index = parseInt(itemObj.index) + shift ,
                beforeArr = itemArr.slice(0, index),
                afterArr = itemArr.slice(index, itemArr.length),
                item = {
                    text: itemText
                },
                newArr = $.merge( beforeArr, [item] );
            newArr = $.merge( newArr, afterArr );
            var list = obj.createListCode( newArr, listObj.type );
            // insert new list
            obj.insertText( list, listObj.start, listObj.end);
            // set selection new item
            obj.setListItemSelection(listObj.index, index);
        }

        function afterList(){
            var itemText = $.trim( selText.length ? selText : label ),
                itemArr = testObj.elements,
                item = {
                    text: itemText
                };
            var list = obj.createListCode( $.merge(itemArr, [item]), testObj.type ),
                end = obj.getCaretPos() + selText.length,
                afterText = area.value.substring(end, area.value.length),
                spaceFix = afterText.length - obj.trimLeft( afterText ).length;
            // del old text
            obj.insertText( '', testObj.end, end );
            // insert new list
            obj.insertText( list + '\n\n', testObj.start, testObj.end + spaceFix);
            // set selection new item
            obj.setListItemSelection(testObj.index, itemArr.length - 1);
        }

        function inItem(){
            var listObj = testObj.list,
                itemObj = testObj.item,
                itemArr = listObj.elements,
                index = parseInt(itemObj.index) ,
                beforeArr = itemArr.slice(0, index),
                afterArr = itemArr.slice(index + 1, itemArr.length),
                start = obj.getCaretPos(),
                end = start + selText.length,
                newItems = [],
                newArr = [],
                inTextPos;
            if( start >= itemObj.start && end <= itemObj.textStart ){ // {3. }list item
                newItems.push({ text: label });
                newItems.push(itemObj);
            } else if( (!selText.length || !$.trim( area.value.substring(start, end) ).length ) && start >  itemObj.textStart && end < itemObj.end ){ // 3. li{}st i{}tem
                inTextPos = start - itemObj.textStart;
                newItems.push({ text: itemObj.text.substring(0, inTextPos) });
                newItems.push({ text: itemObj.text.substring(inTextPos, itemObj.text.length) });
                index++;
            } else if(selText.length && ( start >= itemObj.start && start <=  itemObj.textStart) && end < itemObj.end ){ // 3. {lis}t item || 3{. lis}t item
                inTextPos = end - itemObj.textStart;
                newItems.push({ text: itemObj.text.substring(0, inTextPos) });
                newItems.push({ text: itemObj.text.substring(inTextPos, itemObj.text.length) });
            } else if(selText.length && start >= itemObj.start && end == itemObj.end ){ // 3. list it{em}
                inTextPos = start - itemObj.textStart;
                newItems.push({ text: itemObj.text.substring(0, inTextPos) });
                newItems.push({ text: itemObj.text.substring(inTextPos, itemObj.text.length) });
                index++;
            } else if(selText.length && start > itemObj.start && end < itemObj.end ){ // 3. lis{t it}em
                var inTextPosStart = start - itemObj.textStart,
                    inTextPosEnd = inTextPosStart + selText.length;
                newItems.push({ text: itemObj.text.substring(0, inTextPosStart) });
                newItems.push({ text: selText });
                newItems.push({ text: itemObj.text.substring(inTextPosEnd, itemObj.text.length) });
                index++;
            }

            if(!newItems.length){ return; }
            newArr = $.merge( beforeArr, newItems );
            newArr = $.merge( newArr, afterArr );
            var list = obj.createListCode( newArr, listObj.type  );
            // insert new list
            obj.insertText( list, listObj.start, listObj.end);
            // set selection new item
            obj.setListItemSelection(listObj.index, index);
        }

        //obj.console(testType);

        if(testObj && ( testType == 'betweenItems2' || testType == 'afterList' || testType == 'wrapItem' || testType == 'inItem' ) ){
            if(testType == 'betweenItems2' || testType == 'wrapItem'){
                stopEvent(e);    
            }
            if(testType == 'betweenItems2'){
                betweenItems(1);
            } else if ( testType == 'afterList' && selText.length == 0 ){
                var selEnd = obj.getCaretPos() + selText.length,
                    listEnd = testObj.end,
                    betweenText = area.value.substring(listEnd, selEnd).replace(/\r/gim, ''),
                    shift = betweenText.length - obj.clearLineFeeds(betweenText).length;
                if(shift == 0){
                    stopEvent(e);
                    afterList();    
                }
            } else if ( testType == 'wrapItem' ){
                if( testObj.item && testObj.list.elements[parseInt(testObj.item.index) + 1] ){
                    stopEvent(e);
                    obj.setListItemSelection(testObj.list.index, parseInt(testObj.item.index) + 1);
                } else {
                    var startPos = parseInt(testObj.list.end),
                        tBrs = '\n';
                    if( obj.isDosText ){ // for opera
                        tBrs = '\r\n'; 
                    }
                    var endPos = startPos + tBrs.length;
                    obj.insertText( tBrs, startPos, endPos);
                    obj.setSelection(endPos, endPos);
                }
            } else if ( testType == 'inItem' ){
                stopEvent(e);
                inItem();
            }
        }
    },
    //end list inter function

    // for console 
    conTextIndex: 1,
    conTextStore: '',
    consoleBox: null,
    console: function(mes, flag){
        var obj = this,
            area = obj.el,
            $area = $(area);

        if(!obj.consoleBox){
            obj.consoleBox = $('<div class="error"/>').insertBefore($area);
        }

        if(flag){
            obj.consoleBox.append(mes);
        } else {
            obj.consoleBox.html(mes);
        }
    }

    // END list
}
