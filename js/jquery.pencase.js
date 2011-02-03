jQuery.fn.pencase = function(user_options) {
    var $ = jQuery,
        pencil = jQuery.fn.pencase,
        obj = this,
        options = $.extend({
            // Defaults
            // texts
            create_text : 'Add',
            submit_text : 'Save',
            empty_text : pencil.words['noSaveData'],
            // box
            controls_wrap : '<div class="pencase-controls-box"><div class="pencase-controls-count pencase-corner"><em>'+ pencil.words["insert"] + '</em>{content}</div></div>',
            //plugins
            allowEmpty: false,
            //plugins : null,
            // init data from json
            value : null,
            mobile : false
            //defaulFields: null
        }, user_options),

        titles = {
            drag :  pencil.words['drag'],
            up :  pencil.words['up'],
            down :  pencil.words['down'],
            remove : pencil.words['remove']
        },
        // templates, will be cloned later
        elements = {
            create : $('<span class="pencase-create" />').text(options.create_text),
            remove : $('<i title="'+ titles.remove +'" class="pencase-remove" />'),
            moveup : $('<i title="'+ titles.up +'" class="pencase-moveup" />'),
            movedown : $('<i title="'+ titles.down +'" class="pencase-movedown" />'),
            sortDirect : $('<div class="pencase-sortDirect"/>'),
            sortDirectCount : $('<div class="pencase-sortDirect-count"/>'),
            mainBox : $('<div class="pencaseBox"/>'),
            blocksBox : $('<div class="pencase-content"/>'),
            block : $('<div class="pencase-block"/>'),
            contentBlockWrap: $('<div class="pencase-block-box-wrap"/>'),
            contentBlock : $('<div class="pencase-block-box pencase-corner"/>'),
            drag : $('<i title="'+ titles.drag +'" class="pencase-drag"/>'),
            submit : $('<div class="pencase-submit"/>'),
            submitBut : $('<span class="submit"/>').text(options.submit_text),
            errorBox : $('<div class="pencase-error"/>')
        };


    //options.value = '["text",  "header", {"type":"header","value":{"size":2,"text":"Заголовище"}},{"type":"text","value":"Некий **текст** с [ссылкой](http://example.ru/)"},{"type":"images","value":[{"id":"7831982","description":"фото1"},{"id":"7831972"},{"id":"7831974","description":"фото 3"}]},{"type":"bigImage","value":{"id":"7831972"}},{"type":"video","value":"http://vimeo.com/moogaloop.swf?clip_id=17631561"},{"type":"audio","value":[{"id":"149258","title":"Lady Gaga - Alejandro (Prod. by RedOne)","duration":"4:20"},{"id":"149271","title":"A Few Dudes - Imagination (Original Mix)d","duration":"6:43"},{"id":"149271","title":"A Few Dudes - Imagination (Original Mix)d","duration":"6:43"}]}]';
    //options.value = '[{"type":"text","value":"dddd","errors":[]}]';
    //options.value = '["text",  "header", {"type":"header","value":{"size":2,"text":"Заголовище"}, "errors": ["первая онибка", "вторая ошибка"]},{"type":"text","value":"Некий **текст** с [ссылкой](http://example.ru/)"}]';
    //options.value = '[{"type":"header","value":{"size":2,"text":"1111111111"}},{"type":"text","value":"s222222222222"},{"type":"markDown","value":"sssssssss333333333333"},{"type":"nicEdit","value":"ffff44444444444444"},{"type":"video","value":"http://www.youtube.com/v/3Fdqn2mzQqw"}]';
    //options.allowEmpty = true;

    //options.value = '[{"type":"text","value":"ssssssssssddddddd"},{"type":"video","value":{"extension":"mp4","clip":"197/279/1972796725.medium.mp4","picture":"http://audio.local/d/jpg/197/279/1972796725.jpg","http":"http://audio.local/d/mp4/","rtmp":"rtmp://audio.local/vod/"}}]';


    // test mobile browsers
    function mobileTest(){
        var flag = screen.width < 640 ? true: false;
            flag = false;
        if( navigator.userAgent.match(/Mobile|iPhone|iPad|Opera Mini|Nokia|Symbian|Android|Smartphone|Motorola|IEMobile/i) ){
            flag = true;
        }
        return flag;
    }
    if(!options.mobile && mobileTest()){
        return
    }
    // END test mobile browsers

    //value test
    try{
        if( !$.evalJSON(options.value).length ){
           options.value = null;
        }
    }catch(err){
        options.value = null;
    }

    this.init = function(){
        return this.each(function() {
            new $.fn.pencase.EditorObj($(this).hide(), options, elements);
        });
    };

    return this.init();
};

jQuery.fn.pencase.EditorObj = function(el, options, elements) {
    var $ = jQuery,
        pencil = jQuery.fn.pencase,
        obj = this,
        controls_html = '<div class="pencase-controls"></div>';
    this.el = elements;
    this.form = el.parents('form');
    this.plugins = $.fn.pencase.plugins;
    this.mainBox = obj.el.mainBox.clone().insertAfter(el);
    this.disabelBox = $('<div class="pencase-disableBox"/>').appendTo(obj.mainBox);
    this.blocksBox = obj.el.blocksBox.clone().appendTo(obj.mainBox);
    this.controlsBox = ( options.controls_wrap ? $(options.controls_wrap.replace('{content}', controls_html)) : $(controls_html) );
    this.controls = $(".pencase-controls", obj.controlsBox).length ? $(".pencase-controls", obj.controlsBox) : obj.controlsBox;
    this.submitBox = obj.el.submit.clone().appendTo(el);
    this.submitBut = obj.el.submitBut.clone().appendTo(obj.submitBox);
    this.errorBox = obj.el.errorBox.clone().hide().appendTo(obj.mainBox);
    this.startValues = null;

    // disabe select text in controlsBox
    function desableSelecText(el){
        el.onselectstart  = function() {  return false; };
        el.unselectable = "on";
        jQuery(el).css('-moz-user-select', 'none');
    }
    desableSelecText(obj.controlsBox.get(0));

    this.init = function(){

        //ie corners
        if($.browser.msie){
            var inses = '<ins class="corn lt_corn"/><ins class="corn rt_corn"/><ins class="corn lb_corn"/><ins class="corn rb_corn"/>';
            obj.el.contentBlock.prepend(inses);
            $('.pencase-corner' , obj.controlsBox).prepend(inses);
        }

        // creating plugins
        function createPlugins(plugin, value){
            var pluginObj = obj.plugins[plugin];
            if(!pluginObj || pluginObj.hidden  && !value){
                return;
            }

//            if( options.defaulFields && $.inArray(plugin, options.defaulFields) == -1 ){ return; } // for disable plugins
//
//            // show default block
//            if(value){
//                obj.createBlock(plugin, value);
//            }else if(pluginObj.isDefault || $.inArray(plugin, options.defaulFields) != -1 ){
//                obj.createBlock(plugin);
//            }

            // show block
            return obj.createBlock(plugin, value);
        }

        // creating plugins links
        function createPluginLinks(plugin){
            //label
            var label,
                pluginObj = obj.plugins[plugin]; // for non block plugin
            if(pencil.words['h_'+ plugin]){
                label = pencil.words['h_'+ plugin];
            } else{
                label = plugin;
            }

            var create_link = obj.el.create.clone()
                .html('<b><i/></b><br clear="both"/>'+ label)
                .addClass('pencase-plugin-' + plugin);
            create_link.appendTo( obj.controls )
                .click(function() {
                    if(pluginObj.nonBlock){
                        pluginObj.init(obj);
                    } else{
                        obj.createBlock(plugin); // for non block plugin
                    }
                    return false;
                });
        }

        function displayErrors(errors, block){
            if(!errors || !block){ return; }
            var errorText='';
            if(typeof(errors)=='object' && errors.length){
                for(var x=0, l=errors.length; x<l; x++){
                    if(l>1){ errorText += ' - '; }
                    errorText += errors[x] + '<br/>';
                }
            } else{
                errorText = errors;
            }
            if(errorText.length){
                $("div.pencase-errorBox", block).show().html('<div class="error"><span/>'+ errorText +'</div>');
            }
        }

        //links
        for(var plugin in obj.plugins) {
            if(!obj.plugins[plugin].hidden){
                (function(plugin){
                    createPluginLinks(plugin);
                    if(!options.value && obj.plugins[plugin].isDefault){
                        createPlugins(plugin);
                    }
                })(plugin);
            }
        }


        // create blocks from JSON
        if(options.value){
            var JSON = $.evalJSON( options.value );
            if(!JSON){ return; }
            for(var x=0, l=JSON.length; x<l; x++) {
                if(typeof(JSON[x]) == 'string'){
                    createPlugins(JSON[x]);
                } else {
                    var block = createPlugins(JSON[x].type, JSON[x].value);
                    displayErrors(JSON[x].errors, block);
                }
            }
        }

        // insert init
        obj.defaultControls();

        // hover for insert
        obj.controlsBox.hover(
            function () {
                obj.clearTimers();
            },
            function () {
                obj.clearTimers();
            }
        );


    };
    this.timers = [];
    this.clearTimers = function(){
        for( var x = 0, l = obj.timers.length; x < l; x++ ){
            clearTimeout(obj.timers[x]);
        }
        obj.timers.length = 0;
    };

    function setOpacity(el, val){
        el.css('opacity', val);
    }

    function animateHide(el){
        obj.blocksBox.css('min-height', obj.blocksBox.height() +'px' );
        setOpacity(el, '0.7');
        setTimeout(function(){
            setOpacity(el, '0.4');
        }, 25);
        setTimeout(function(){
            el.css('visibility', 'hidden');
            setOpacity(el, '');
        }, 50);
    }

    function animateShow(el){
        setOpacity(el, '0.4');
        el.css('visibility', '');
        setTimeout(function(){
            setOpacity(el, '0.7');
        }, 25);
        setTimeout(function(){
            setOpacity(el, '');
            obj.blocksBox.css('min-height','' );
        }, 50);
    }

    this.defaultControls = function(){
        var new_block = $('div.pencase-block:last', obj.blocksBox),
            element,
            infocus = obj.inFocusEl;
        if(obj.inSortable){
            element = new_block;
            obj.inFocusEl = null;
        } else if(infocus){
            element = infocus;
        } else{
            element = new_block;
        }
        obj.clearTimers();
        var timer = setTimeout(function(){
            if( obj.controlsBox.prev().get(0) != element.get(0) ){
                obj.blocksBox.css('min-height', obj.blocksBox.height() +'px' );
                obj.controlsBox
                    .css('visibility', 'hidden')
                    .slideUp(150, function(){
                        obj.controlsBox
                            .insertAfter( element )
                            .slideDown(150, function(){
                                animateShow(obj.controlsBox);
                            });
                    });
            }
        }, 50);
        obj.timers.push(timer);
    };
    this.blocksTest = function(){
        var blocks = $('div.pencase-block', obj.blocksBox),
            flag;
        if(blocks.length > 20){
            obj.errorBox.empty().show().append('<div class="error"><span/>'+ jQuery.fn.pencase.words['blocksError'] +'</div>');
            flag = true;
        } else{
            obj.errorBox.hide();
        }
        return flag;
    }
    this.inFocusEl = null;
    this.insBlock;
    this.createBlock = function(plugin, value ){
        var content_wrap = obj.el.contentBlockWrap.clone(),
            conten_block = obj.el.contentBlock.clone().appendTo(content_wrap),
            header = $('<strong/>').appendTo(conten_block).text(pencil.words['h_'+ plugin]);
        var new_block = obj.el.block.clone()
                .addClass('pencase-block-' + plugin)
                .data('data-type', plugin),
            new_block_object = new $.fn.pencase.EditorBlock(obj, new_block, conten_block, plugin, function(){
                obj.hideLinks();
            }, value),
            sortDirect = obj.el.sortDirect.clone();

        new_block
            // sort direct box
            .append(sortDirect)
            // remove link
            .append(obj.el.remove.clone()
                        .click(function() {
                            obj.defaultControls();
                            new_block_object.remove();
                            return false;
                        }))
            // content block
            .append(content_wrap);
            // error box
            conten_block.append('<div class="pencase-errorBox"/>');

        obj.el.sortDirectCount.clone().appendTo(sortDirect)
            // move up link
            .append(obj.el.moveup.clone()
                        .click(function() {
                            obj.defaultControls();
                            new_block_object.move(-1);
                            return false;
                        }))
            // drag box
            .append(obj.el.drag.clone())
            // move down link
            .append(obj.el.movedown.clone()
                        .click(function() {
                            obj.defaultControls();
                            new_block_object.move(1);
                            return false;
                        }));

        // Insert block
        if(obj.insBlock){
            new_block.insertAfter(obj.controlsBox);
        } else {
            new_block.appendTo(obj.blocksBox);
        }

        obj.hideLinks();

        // hover for insert
        function showControls(){
            obj.clearTimers();
            if( !obj.inSortable ){
                var timer = setTimeout(function(){
                    showControlsAction();
                }, 500);
                obj.timers.push(timer);
            }
        }

        function showControlsAction(){
            var element,
                infocus = obj.inFocusEl;
            if(infocus){
                element = infocus;
            } else{
                element = new_block;
            }
            if( obj.controlsBox.prev().get(0) != element.get(0) ){
                animateHide(obj.controlsBox);
                obj.controlsBox.slideUp(150, function(){
                        obj.controlsBox
                            .insertAfter( element )
                            .slideDown(150, function(){
                                animateShow(obj.controlsBox);
                                obj.insBlock = true;
                            });
                });
            }
        }

        content_wrap.mouseenter(showControls)
                    .mousemove(showControls);

//        content_wrap.focusin(function(){
//            obj.inFocusEl = new_block;
//            showControlsAction(true);
//
//        });
//
//        content_wrap.focusout(function(){
//            obj.inFocusEl = null;
//        });

        return new_block; // for image plugin
    };
    this.hideLinks = function(){
        var elems = $('div.pencase-block', obj.blocksBox),
            firstDir = $('.pencase-sortDirect-count', elems[0]);

        $('.pencase-moveup, .pencase-movedown', elems).css('visibility', '');
        $('.pencase-moveup', elems[0] ).css('visibility', 'hidden');
        $('.pencase-movedown', elems[elems.length-1] ).css('visibility', 'hidden');
        if(elems.length > 1){
            firstDir.show();
        } else {
            firstDir.hide();
        }

        if(elems.length == 1){
            $('.pencase-remove', elems).hide();
        } else {
            $('.pencase-remove', elems).css('display', '');
        }
    };

    // sort
    this.inSortable = false;
    obj.blocksBox.sortable({
            cursor: "move",
            containment: '.pencaseBox',
            handle: '.pencase-drag',
            revert: true,
            tolerance: "pointer",
            items: '> .pencase-block',
            start: function(e, ui) {
                obj.inSortable = true;
                obj.defaultControls();
            },
            stop: function(e, ui) {
                obj.inSortable = false;
                ui.item.attr('style', '');
                obj.hideLinks();
                if($.browser.msie){
                    setTimeout(function(){
                        var ieElFix = $('<div/>');
                        $('div.pencase-content', obj.mainBox).append(ieElFix);
                        ieElFix.remove();
                    }, 100);
                }
            },
            change: function(e, ui) {
                obj.hideLinks();
            }
        });

    obj.submitBox.remove(); // remove default submit box

    // Public Methods
    var areaEl = el.get(0);
    areaEl.updateData = function(){ obj.submit();}
    areaEl.disable = function(){ obj.disable(); }
    areaEl.undisable = function(){ obj.undisable(); }

    this.disable = function(){
        obj.mainBox.addClass("pencase-disable");
    },
    this.undisable = function(){
        obj.mainBox.removeClass("pencase-disable");
    },

    obj.form.submit(function(e){
        obj.inSubmit = true;
        obj.disable();
        obj.submit(e);
        setTimeout(function(){
            obj.inSubmit = false;
        }, 2000);
        //return false;
    });

    function getValue(plugin, box){
        var value;
        if( typeof( plugin.serialize ) == 'function' ){
            value = plugin.serialize(box);
        }
        return value;
    }

    this.getEditorData = function(empty){
        var bocks = $('div.pencase-block', obj.blocksBox),
            data = [];
        bocks.each(function(){
            var box = $(this),
                type = box.data('data-type'),
                value = getValue( obj.plugins[type], box );
            if(value){
                data.push({
                    type : type,
                    value : value
                });
            } else {
                data.push({type : type});
            }

        });
        return data;
    };

    this.submit = function(e){
        var bocks = $('div.pencase-block', obj.blocksBox),
            data = obj.getEditorData(), // GET DATA
            blocksTest = obj.blocksTest(), // TEST BLOKS COUNT
            errorFlag,
            firstErrorField;

        function stopSubmit(){
            if( options.allowEmpty && $.toJSON(obj.getEditorData(true)) == $.toJSON(obj.startValues) ){ // check user actions
                    $("div.pencase-errorBox", obj.mainBox).hide()
            } else{
                // stop submit
                e.stopImmediatePropagation();
                e.preventDefault();
                e.stopPropagation();
                obj.undisable();
            }
        }

        function scrollOnError(box){
            if(!box){ return; }
            var scroll = parseInt( $(box).offset().top ) || 0,
                docScroll = parseInt( $(document).scrollTop() ) || 0;
            if(scroll < docScroll){
                scroll -= parseInt($(window).height()/2 - $(box).outerHeight()/2);
                $('html').animate({scrollTop: + scroll}, 1500);
            }
        }

        if(blocksTest){ stopSubmit(); }

        //get errors
        bocks.each(function(){ // VALIDATE PLUGINS
            var box = $(this),
                type = box.data('data-type'),
                errorBox = $("div.pencase-errorBox", box).hide(),
                value = getValue( obj.plugins[type], box ),
                error;
            if(!value){
                error = jQuery.fn.pencase.words['emptyBlockError'];
            }
            else if( typeof( obj.plugins[type].validate ) == 'function' ){
                error = obj.plugins[type].validate(box);
            }
            if(error){
                errorBox.show().html('<div class="error"><span/>'+ error +'</div>');
                errorFlag = true;
                if(!firstErrorField){
                    firstErrorField = errorBox;
                }
            }
        });


//        stopSubmit();
//
//        alert($.toJSON(data) || '');


        if(errorFlag){
            stopSubmit();
            scrollOnError(firstErrorField);
        }
        else{
            if(data.length){
                var JSONStr = $.toJSON(data) || '';
                el.val(JSONStr);
                alert(JSONStr);
                //console.warn(JSONStr); stopSubmit();
            } else{
                el.val('');
            }
        }
    }
    // end save

    // confirm escape
    this.inSubmit = false;
    this.confirmEscape = function(){
        $(window).bind('beforeunload', confirmExit);
        function confirmExit(event){
            if( $.toJSON(obj.getEditorData(true)) != $.toJSON(obj.startValues) ){ // check user actions
                if(!obj.inSubmit){
                    return $.fn.pencase.words['confirmEscape'];
                }
            }
        }
    };
    obj.confirmEscape();
    // end confirm escape

    // Display errors
    this.errors = function(mes){
        var bocks = $('div.pencase-block', obj.blocksBox);
        $('.pencase-errorBox', bocks ).show().html('<div class="error">'+ mes +'</div>');
    },
    // End Display errors

    // controls
    obj.blocksBox.hover(
        function () {},
        function () {
            obj.defaultControls();
        }
    );

    obj.init();

    // save start editor values
    obj.startValues = obj.getEditorData(true);

    obj.defaultControls();


    // direct box width
    function directBoxWidth(){
        var box = obj.controls.parent(),
            label = $('em', box),
            width = label.outerWidth() + obj.controls.outerWidth() + 15;
        if(width > 200){
            box.css('width', width +'px');
        } else {
            setTimeout(directBoxWidth, 10);
        }
    }
    $(document).ready(directBoxWidth);
    // End direct box width

};


// block object
jQuery.fn.pencase.EditorBlock = function(editorObj, el, box, plugin_type, clearFunc, value) {
    var $ = jQuery,
        obj = this;
    this.el = el;
    this.editorObj = editorObj;
    this.value = value || null;
    this.editor = editorObj.mainBox;
    this.remove = function() {
        var block = el.parent();
        el.remove();
        obj.clear();
    };
    this.move = function(offset) {
        var prev = $.merge( [], el.prevAll('.pencase-block') ).reverse(),
            next = el.nextAll('.pencase-block'),
            position = prev.length,
            siblings = $.merge(prev, next),
            new_offset = position + offset;

        if ( offset > 0 && new_offset <= siblings.length ) {
            el.insertAfter(siblings[new_offset - 1]);
        } else if ( offset < 0 && new_offset >= 0 ){
            el.insertBefore(siblings[new_offset]);
        }
        obj.clear();
    };
    this.clear = function(){
        if(clearFunc) { clearFunc(); }
    }
    // run constructor
    el.pencase.plugins[plugin_type].init(box, obj);
};


// WORDS
jQuery.fn.pencase.words = {
    noSaveData : 'No data for save',
    drag : 'Drag',
    up :  'Up',
    down : 'Down',
    remove : 'Remove',
    insert : 'Insert',
    // headers
    h_header : 'Header',
    h_text : 'Text',
    h_markDown : 'Markdown',
    h_nicEdit: 'NicEdit',
    h_image : 'Image',    
    h_video : 'Video',

    // errors
    error : 'Error',
    blocksError : 'No more than 20  blocks',
    emptyBlockError : 'Empty block',
    // confirm
    confirmEscape: 'You have unsaved  data',
    // for plugins
    header : 'Header',
    addText : 'Add text',
    previewHeader : 'Preview',
    addImage : 'Add image',
    description : 'Description',
    insertVideoAllow : 'Allow insert from',
    insertVideoButton : 'Insert',
    insertVideoText : 'Insert a link or code of a player',
    addTrack : 'Add track',
    // plugin errors
    textError : 'Maximum text length of 10000 symbols',
    imagesError : 'No more than 100 photos',
    descriptionError: 'Maximum discription length of 255 symbols',
    tracksError: 'Maximum of 50 tracks',
    headerError: 'Maximum header length of 255 symbols'

}

// PLUGINS
// plugin object
jQuery.fn.pencase.plugins = {};

// header plugin
jQuery.fn.pencase.plugins.header = {
    isDefault : true,
    defaultTex : '',
    serialize : function(el){
        var val = $.trim( $('input', el).val() ),
            size = $('.pencase-current', el).data('value');
        if(val.length && val != this.defaultTex){
            return {size : size, text : val}
        }
    },
    validate: function(el){
        var val = this.serialize(el);
        if(val && val.text && val.text.length > 255){
            return jQuery.fn.pencase.words['headerError'];
        }

    },
    setValues: function(val, area, select ){
        var options = select.children();
        options.each(function(){
            var opt = $(this),
                classVal = 'pencase-current';
            if( opt.data('value') == val.size ){
                options.removeClass(classVal);
                opt.addClass(classVal);
            }
        });
        area.val(val.text).removeClass('default');
    },
    init : function(el, blockObj) {
        var $ = jQuery,
            text = jQuery.fn.pencase.words['header'],
            box = $('<div class="pencase-block-header-box"/>'),
            area = $('<input value="'+ text +'" class="default"/>').appendTo(box),
            select = $('<div class="pencase-header-select"/>').appendTo(box),
            optTemp = $('<i/>'),
            optArr = [
                {pad: 8, h: 'H1', val: 1, text: 'big', size: '24px'},
                {pad: 5, h: 'H2', val: 2, text: 'normal', size: '19px', isDefault: true},
                {pad: 3, h: 'H3', val: 3, text: 'small', size: '16px'}
            ],
            sizeArr = {};

        this.defaultTex = text;

        el.append(select).append(box).append('<br clear="both"/>');

        function changeType(el){
            var val = el.data('value'),
                size = sizeArr[val],
                pad = el.data('pad');
            area.css('font-size', size);
            $('.pencase-current' ,select).removeClass('pencase-current');
            el.addClass('pencase-current');
            if(pad){
                select.css('padding-top', pad+ 'px');
            }
        }

        for(var x=0, l = optArr.length; x < l; x++){
            var obj = optArr[x],
                option = optTemp.clone()
                        .data('value', obj.val)
                        .data('pad', obj.pad)
                        .text(obj.h)
                        .addClass('pencase-header-select-'+ obj.text).appendTo(select);
            sizeArr[obj.val] = obj.size;
            if(obj.isDefault){
                option.addClass('pencase-current');
            }
        }

        var typeLink = $('i' ,select);

        changeType($('.pencase-current' ,select));

        typeLink.click(function(){
            changeType( $(this) );
        });

        area
            .focus(function(){
                if($.trim( area.val() ) == text){
                    area.val('').removeClass('default');
                }
            })
            .blur(function(){
                if(!$.trim( area.val() ).length){
                    area.val(text).addClass('default');
                }
            }).keypress(function(e){
                //e.preventDefault();
                return e.which != 13
            });

        //  set values
        if(blockObj.value){
            this.setValues(blockObj.value, area, select);
        }
    }
}

 //Text simple plugin

jQuery.fn.pencase.plugins.text = {
    isDefault : true,
    //hidden:true,
    serialize:function(el){
        var val = $.trim( $('textarea', el).val() );
        if(val.length){
            return val;
        }
    },
    validate: function(el){
        var val = this.serialize(el);
        if(val && val.length > 10000){
            return jQuery.fn.pencase.words['textError'];
        }

    },
    setValues: function(val, area, label){
        label.hide();
        area.val(val);
    },
    init : function(el, blockObj) {
        var $ = jQuery,
            text = jQuery.fn.pencase.words['addText'],
            box = $('<div class="pencase-block-text-box"/>'),
            label = $('<label for="">'+ text +'</label>').appendTo(box),
            area = $('<textarea class ="pencase-simpleText-area"/>').appendTo(box),
            ereaEl = area.get(0);
        el.append(box);

        function updateSize(){
            area.css('height', '0');
            var height = parseInt(ereaEl.scrollHeight) + parseInt(area.css('font-size'));
            box.css('height', (height + 5) +'px');
            area.css('height', height +'px');
        }

        area
            .focus(function(){
                label.hide();
            })
            .blur(function(){
                if($.trim( area.val() ).length){
                    label.hide();
                }
                else{
                    label.show();
                }
            }).keydown(function(){
                updateSize();
            })
            .keyup(function(){
                updateSize();
            });

        setTimeout(function(){
            updateSize();
        }, 200);

        //  set values
        if(blockObj.value){
            this.setValues(blockObj.value, area, label);
        }
    }
}



 //Markdown plugin

jQuery.fn.pencase.pluginMarkdownWords = {
    strong: "strong text",
    em: "italic text",
    ins: "emphasized text",
    linkText: "link text",
    linkHref: "http://example.ru/",
    linkTitle: "Title",
    listItem: "list item",
    // link add popUp
    popLink : 'Link', //Ссылка
    popText : 'Text',//Текст
    popInsert : 'Insert',//Вставить
    popCancel : 'Cancel'//Отменить

}


jQuery.fn.pencase.plugins.markDown = {
    isDefault : true,
    serialize: function(el){
        var val = $.trim( $('textarea', el).val() );
        if(val.length){
            return val;
        }
    },
    validate: function(el){
        var val = this.serialize(el);
        alert(val);
        if(val && val.length > 10000){
            return jQuery.fn.pencase.words['textError'];
        }

    },
    setValues: function(val, area, label, updatePreview){
        label.hide();
        area.val(val);
        updatePreview();
    },
    init : function(el, blockObj) {
        var $ = jQuery,
            text = $.fn.pencase.words['addText'],
            prewHeader = $('<strong/>').text($.fn.pencase.words['previewHeader']),
            mainBox = $('<div class="pencase-block-text-editor pencase-corner"/>'),
            butBox = $('<div class="pencase-block-text-butBox"/>').appendTo(mainBox),
            box = $('<div class="pencase-block-text-box"/>').appendTo(mainBox),
            label = $('<label for="">'+ text +'</label>').appendTo(box),
            area = $('<textarea></textarea>').appendTo(box),
            previewBox = $('<div class="pencase-textPreviewBox"/>').append(prewHeader).hide(),
            previewWrap = $('<div class="pencase-textPreviewWrap pencase-corner"/>').appendTo(previewBox),
            preview = $('<div class="pencase-textPreview"/>').appendTo(previewWrap),
            ereaEl = area.get(0),
            words = jQuery.fn.pencase.pluginMarkdownWords,
            editor = new simpleEditor(ereaEl),
            parser = new markdownConverter(),
            buttons = [
                {
                    className : 'pencase-strong',
                    action: function(){
                        editor.simpleWrap('**','**', words['strong']);
                    }
                },
                {
                    className : 'pencase-em',
                    action: function(){
                        editor.simpleWrap('_','_', words['em']);
                    }
                },
                {
                    className : 'pencase-link',
                    action: function(){
                        editor.createLink(words['linkHref'], words['linkText']);
                        //createPopUpLink();
                    }
                },
                { className : 'pencase-seporator' },
                {
                    className : 'pencase-ul',
                    action: function(){
                        editor.createList('ul');
                    }
                },
                {
                    className : 'pencase-ol',
                    action: function(){
                        editor.createList('ol');
                    }
                },
                { className : 'pencase-seporator' },
                {
                    className : 'pencase-undo',
                    action: function(){
                        editor.undo();
                    }
                },
                {
                    className : 'pencase-redo',
                    action: function(){
                        editor.redo();
                    }
                }
            ];

        editor.linkLabel = words['linkText'];
        editor.linkUrlLabel = words['linkHref'];
        editor.listLabel = words['listItem'];

        for(var x = 0, l = buttons.length; x < l; x++){
            var obj = buttons[x],
//                but = $('<img/>').addClass(obj.className); // tag img important for focus in area in IE
//                if($.browser.msie){ but.attr('src', 'img/e.gif"'); }
                but = $('<div class="but"/>').addClass(obj.className);

            (function(x) {
                but.mousedown(function(e){
                    var obj = buttons[x];
                    e.preventDefault(); // important for focus in area
                    e.stopPropagation();
                    if(obj.action){
                        obj.action();
                    }
                    updateSize();
                    updatePreview();
                });
            })(x);
            butBox.append(but);
        }

        el.append(mainBox).append(previewBox);

        // help popUp
        var showHelpHtml;
        function showHelp(){
            function showPopUp(html){
                Popups.showPopup(html, function(){
                    $('.closeHelp', Popups.Pc).click(function(){
                        Popups.closePopup();
                    });
                }, 500);
            }
            if(showHelpHtml){
                showPopUp(showHelpHtml);
            } else {
                $.get('/j/plugins/pencase/help.html', function(data){
                    if( data && data.length > 1000){
                        showPopUp(data);
                        showHelpHtml = data;
                    }
                });
            }
        }

        function updateSize(){
            area.css('height', '0');
            var fontHeight = parseInt(area.css('font-size')),
                height = parseInt(ereaEl.scrollHeight) + fontHeight+6;
            box.css('height', height  +'px');
            area.css('height', height +'px');
        }

        function testString(str, symbols){
            for(var x=0, l=symbols.length; x<l; x++){
                if( str.indexOf(symbols[x]) != -1 ){
                    return true;
                }
            }
            return false;
        }

        function markdownTest(str){
            var symbols = ['<', '>', '*', '_', '[', ']', '- ', '1. ', '2. ', '3. ', '4. ', '5. ', '6. ', '7. ', '8. ', '9. ', '0. ', 'http'];
            return testString(str, symbols);
        }

        function regCropTags(text){
            var text = text || '',
                reg = /<(?!(([\s|\/]*)(a|strong|em|strike|p|br|ul|ol|li|blockquote)(\s|>)([\s|\S]*)>))(\s*[\s\S]*?)>/gim; // crop tags
            //crop script
            text = text.replace(/(<(script)(?:[^>"\']*|"[^"]*"|\'[^\']*\')*)([\S\s]*?)(\S*)(<\/\2>)/gim,"");
            return text.replace(reg, '');
        }

        function cropAttr(text){
            var text = text || '';
            text = text.replace(/<\s*([^\s>]+)\s[^>]+>/gim, function(str, m1){
                var tag = m1 || '',
                    text = $.trim( str.substring(1 + tag.length, str.length - 1) ),
                    attrs = '';
                text.replace(/(href)\s*=\s*["']([\S\s][^"']*)(["'])/gim, function(attr, m1, m2){
                    attrs += m1 + '="'+ m2 + '" ';
                });
                return '<'+ tag + ' ' + attrs +'>';
            });
            return text;
        }

        var previewTimer;
        function updatePreview(){
            if(previewTimer){
                clearTimeout(previewTimer);
            }
            previewTimer = setTimeout(function(){
                updatePreviewAction();
            }, 500);
        }

        function updatePreviewAction(){
            var str = area.val(),
                test =  markdownTest(str);
                //console.warn('markdown -'+ test);
            if(test){
                // crop disallow tags
                //console.time('cropTags');
                str = regCropTags( str );

                // crop attr
                str = cropAttr(str);

                //console.timeEnd('cropTags');
                // parse markdown
                //console.time('parser');
                var html = parser.makeHtml(str),
                    flag = $('*', html).length;
                //console.timeEnd('parser');
                // create simple links
                html = html.replace(/([^"']\b)((https?|ftp|dict):[^'"\s]+)/gi,"$1<a href=\"$2\">$2</a>");

                // create line feeds in paragraphs
                html = html.replace(/(<(p)(?:[^>"\']*|"[^"]*"|\'[^\']*\')*)([\S\s]*?)(\S*)(<\/\2>)/gim, function(text){
                    return text = text.replace(new RegExp("\n",'g'), '<br/>');
                });

                if( flag ){
                    preview.html(html);
                    previewBox.show();
                    return;
                }
            }
            previewBox.hide();
        }

        area
            .focus(function(){
                label.hide();
            })
            .blur(function(){
                if($.trim( area.val() ).length){
                    label.hide();
                }
                else{
                    label.show();
                }
            }).keypress(function(){
                updateSize();
            }).keydown(function(){
                updateSize();
            })
            .keyup(function(){
                updateSize();
                updatePreview();
            });

        setTimeout(function(){
            updateSize();
        }, 200);

        //  set values
        if(blockObj.value){
            this.setValues(blockObj.value, area, label, updatePreview);
            //editor.store[0] = blockObj.value;
        }
    }
}



// nicEdit plugin

jQuery.fn.pencase.plugins.nicEdit = {
    isDefault : true,
    defaultText : 'Add text',
    serialize:function(el){
        var val = $.trim( $('.nicEdit-main', el).html() );
        return val != this.defaultText && val.length ? val : false;
    },
    validate: function(el){
        var val = this.serialize(el);
        if(val && val.length > 10000){
            return jQuery.fn.pencase.words['textError'];
        }

    },
    setValues: function(val, area, createEditor){
        area.val(val);
        createEditor();
    },    
    init : function(el, blockObj) {
        var $ = jQuery,
            text = this.defaultText,
            box = $('<div class="pencase-block-htmlbox-box"/>'),
            id = 'area' + new Date().getTime(),
            area = $('<textarea id="'+ id +'">'+ text +'</textarea>').appendTo(box),
            areaBox,
            areaMainBox;
        el.append(box);

        var editor;
        function initEditor(){
            editor = new nicEditor({
                iconsPath : 'img/nicEditorIcons.gif',
                //buttonList : ['bold','italic','underline', 'link', 'ol','ul'],
                buttonList: ['save','bold','italic','underline','left','center','right','justify','ol','ul','link','unlink'],
                minHeight : 100
            }).panelInstance(id);

        }

        function createEditor(){
            setTimeout(function(){
                initEditor();
                function switchEmptyClass(){
                    var value = $.trim( areaBox.text() );
                    if(value == text || !value.length ){
                        areaBox.addClass('nicEdit-empty');
                    } else {
                        areaBox.removeClass('nicEdit-empty');
                    }
                }
                areaBox = $('.nicEdit-main', el)
                    .focus( function(){
                        if( $.trim( areaBox.text() ) == text){
                            areaBox.html('').removeClass('nicEdit-empty');
                        }
                    })
                    .blur( function(){
                        if( $.trim( areaBox.text() ) == ''){
                            areaBox.html(text);
                        }
                        switchEmptyClass();
                    });
                switchEmptyClass();
                areaMainBox = areaBox.parent().addClass('pancase-nicEdit-area');
            }, 100);
        }

        function removeInstance(){
            if(editor){
                editor.removeInstance(id);
                editor = null;
            }
        }
        // bind callback for remove
        blockObj.onremove = removeInstance;

        //  set values
        if(blockObj.value){
            this.setValues(blockObj.value, area, createEditor);
        } else {
            createEditor();
        }

    }
}

// video plugin

jQuery.fn.pencase.plugins.image = {
    isDefault : true,
    serialize:function(el){
        var val = $.trim( $('embed', el).attr('src') );
        if(val.length){
            return val;
        }
    },
    setValues: function(val, addVideo){
        addVideo(val);
    },
    init : function(el, blockObj) {
        var $ = jQuery,
            pencil = jQuery.fn.pencase,
            doneText = pencil.words['insertVideoButton'],
            errorText = pencil.words['error'] || 'Error',
            defaultText = pencil.words['insertVideoText'],
            box = $('<div class="pencase-block-image-box"/>'),
            //label = $('<label for="">'+ text +'</label>').appendTo(box),
            areaWrap = $('<div class="pencase-block-image-form"/>').appendTo(box),
            areaBox = $('<form/>').submit(function(){ return false; }).appendTo(areaWrap),
            area = $('<input class="default"/>').val(defaultText).appendTo(areaBox),
            doneBut = $('<button/>').text(doneText).appendTo(areaBox),
            errorLabel = $('<p class="error"/>').hide().appendTo(box);


        el.append(box);

        function displayError(mes){
            var mes = mes || errorText;
            errorLabel.html(mes).show();
        }

        function validateSrc(src){
            var reg = '^http:\/\/[\\w-]{2,}\\.[\\w-]{2,}.*?\\.(gif|png|jpg)$';
            if( new RegExp(reg).test(src) ){
                return true;
            } else{ return false; }
        }

        function addImage(){
            var src = $.trim( area.val() );
            if( validateSrc(src) ){
                addImageAction(src);
            } else {
                displayError();    
            }

        }

        function addImageAction(src){
            var img = $('<img/>').attr('src', src);
            //areaWrap.html(img);
            img.load(function(){
                areaWrap.html(img);
            });
        }

        doneBut.bind('click', addImage);
        area
            .keydown(function(e){
                errorLabel.hide();
                if(e.which == 13){
                    addImage();
                    return false;
                }
            })
            .focus(function(){
                if( $.trim( area.val() ) == defaultText ){
                    area.val('').removeClass('default');
                }
            })
            .blur(function(){
                if( $.trim( area.val() ) == '' ){
                    area.val(defaultText).addClass('default');
                }
            });

         //  set values
        if(blockObj.value){
            this.setValues(blockObj.value, addImage);
        }
    }
}


// video plugin

jQuery.fn.pencase.plugins.video = {
    isDefault : true,
    serialize:function(el){
        var val = $.trim( $('embed', el).attr('src') );
        if(val.length){
            return val;
        }
    },
    setValues: function(val, addVideo){
        addVideo(val);
    },
    init : function(el, blockObj) {
        var $ = jQuery,
            pencil = jQuery.fn.pencase,
            allowText = pencil.words['insertVideoAllow'],
            doneText = pencil.words['insertVideoButton'],
            errorText = pencil.words['error'] || 'Error',
            defaultText = pencil.words['insertVideoText'],
            box = $('<div class="pencase-block-video-box"/>'),
            areaWrap = $('<div class="pencase-block-video-form"/>').appendTo(box),
            areaBox = $('<form/>').submit(function(){ return false; }).appendTo(areaWrap),
            area = $('<input class="default"/>').val(defaultText).appendTo(areaBox),
            doneBut = $('<button/>').text(doneText).appendTo(areaBox),
            errorLabel = $('<p class="error"/>').hide().appendTo(box),
            allowLabel = $('<label for="">'+ allowText +'</label>').appendTo(box),
            formats = {
               YouTube : {
                   innerStr : 'youtube.com',
                   link : 'http://www.youtube.com',
                   getLink : function (url){
                        var id;
                        if( id = url.match("[\\?&]v=([^&#]*)") ){
                            return 'http://www.youtube.com/v/'+ id[1];
                        }else if( validateUrl(url, 'youtube\.com\/v\/') ){
                            return url;
                        } else{
                            return false;
                        }
                    }
               },
               RuTube : {
                   innerStr : 'rutube.ru',
                   link : 'http://www.rutube.ru',
                   getLink : function(url){
                        var id;
                        if( id = url.match("[\\?&]v=([^&#]*)") ){
                            return 'http://video.rutube.ru/'+ id[1];
                        } else if( validateUrl(url, 'video\.rutube\.ru\/') ){
                            return url;
                        } else{
                            return false;
                        }
                    }
               },
               Vimeo : {
                   innerStr : 'vimeo.com',
                   link : 'http://www.vimeo.com',
                   getLink : function(url){
                        var id;
                        if( validateUrl(url, 'vimeo\.com\/moogaloop\.swf\\?clip_id=') ){
                            return url;
                        } else if( id = url.match("vimeo.com/([0-9]*)") ){
                            return 'http://vimeo.com/moogaloop.swf?clip_id='+ parseInt(id[1]);
                        } else{
                            return false;
                        }
                    }
               },
               // http://static.video.yandex.ru/lite/remnjoff/xttc6kjg21.1101/
               Yandex : {
                   innerStr : 'video.yandex.ru',
                   hidden : true,
                   getLink : function(url){
                        var id;
                        if( validateUrl(url, 'static\.video\.yandex\.ru\/') ){
                            return url;
                        } else{
                            return false;
                        }
                    }
               }
        };

        // add formats to label
        (function(){
            var arr = [];
            for(var key in formats){
                var format = formats[key];
                if(!format.hidden){
                    if(format.link){
                        arr.push('<a href="'+ format.link +'" target="_blank">'+ key +'</a>');
                    } else {
                        arr.push(key);
                    }
                }
            }
            allowText += ' ' + arr.join(', ');
            allowLabel.html(allowText);
        })();

        el.append(box);

        function displayError(mes){
            var mes = mes || errorText;
            errorLabel.html(mes).show();
        }

        function validateUrl(url, reg){
            var reg = reg || '';
            if( new RegExp('^http:\/\/w*?\.?'+ reg).test(url) ){
                return true;
            } else{ return false; }
        }


        function getLink(val){
            var obj = $(val);
            if( obj && obj.length && obj.get(0).tagName == 'OBJECT' ){
                var embed = $('embed', obj).eq(0);
                if(embed.length && embed.attr('src').length > 15){
                    return embed.attr('src');
                }
                return false;
            } else if(obj && obj.length && obj.get(0).tagName == 'IFRAME' && $(obj.get(0)).attr('src').indexOf('player.vimeo.com/video') != -1 ){ // for vimeo
                var a = $('a', obj).eq(0);
                if(a.length && a.attr('href').length > 15){
                    return a.attr('href');
                }
                return false;
            }
            return val;
        }

        function createLink(url){
            if(!url){ return; }
            url = url.toString();
            for(var key in formats){
                var format = formats[key];
                if( url.indexOf(format.innerStr) != -1){
                    return format.getLink(url);
                }
            }
            return false;
        }

        function addVideo(link){
            if(!link || !link.length){
                var url = getLink($.trim( area.val() )),
                    link = createLink(url);
            }
            if(!link){
                displayError();
                return;
            }

            box.empty();
            var objectBox = $('<div class="pencase-block-video-player"/>').appendTo(box),
                //width = parseInt( objectBox.width() ),
                width = 480,
                height = parseInt(width * 0.7540394973070018),
                object = $([
                    '<object width="'+ width +'" height="'+ height +'">',
                        '<param value="'+ link +'" name="movie">',
                        '<param value="true" name="allowfullscreen">',
                        '<param value="always" name="allowscriptaccess">',
                        '<param value="transparent" name="wmode">',
                        '<embed width="'+ width +'" height="'+ height +'" wmode="transparent" allowscriptaccess="always" allowfullscreen="true" type="application/x-shockwave-flash" src="'+ link +'"></embed>',
                    '</object>'
                ].join('')).appendTo(objectBox);
            doneBut.unbind('click', addVideo);

            return false;

        }

        doneBut.bind('click', addVideo);
        area
            .keydown(function(e){
                errorLabel.hide();
                if(e.which == 13){
                    addVideo();
                    return false;
                }
            })
            .focus(function(){
                if( $.trim( area.val() ) == defaultText ){
                    area.val('').removeClass('default');
                }
            })
            .blur(function(){
                if( $.trim( area.val() ) == '' ){
                    area.val(defaultText).addClass('default');
                }
            });

         //  set values
        if(blockObj.value){
            this.setValues(blockObj.value, addVideo);
        }
    }
}

