jQuery.fn.pencase = function(user_options) {
    var $ = jQuery,
        pencil = jQuery.fn.pencase,
        options = $.extend({
            controls_wrap : '<div class="pencase-controls-box"><div class="pencase-controls-count pencase-corner"><em>'+ pencil.words["insert"] + '</em>{content}</div></div>',
            allowEmpty: false,
            value : null,
            mobile : false
        }, user_options),

        titles = {
            drag :  pencil.words['drag'],
            up :  pencil.words['up'],
            down :  pencil.words['down'],
            remove : pencil.words['remove']
        },
        // templates, will be cloned later
        elements = {
            create : $('<span class="pencase-create" />'),
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
            errorBox : $('<div class="pencase-error"/>')
        };

    // test mobile browsers
    function mobileTest(){
        var flag = screen.width < 640 ? true: false;
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
    this.errorBox = obj.el.errorBox.clone().hide().appendTo(obj.mainBox);
    this.startValues = null;

    // disabe select text in controlsBox
    function desableSelecText(el){
        el.onselectstart  = function() {  return false; };
        el.unselectable = "on";
        $(el).css('-moz-user-select', 'none');
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
                .html('<b><i/></b><br clear="all"/>'+ label)
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

        // show direct box when blocks in focus
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
        obj.disable();
        obj.submit(e);
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

    this.inSubmit = false;    
    this.submit = function(e){
        var bocks = $('div.pencase-block', obj.blocksBox),
            data = obj.getEditorData(), // GET DATA
            blocksTest = obj.blocksTest(), // TEST BLOCKS COUNT
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
                obj.inSubmit = false;
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

        if(errorFlag){
            stopSubmit();
            scrollOnError(firstErrorField);
        }
        else{
            if(data.length){
                var JSONStr = $.toJSON(data) || '';
                el.val(JSONStr);
            } else{
                el.val('');
            }
            obj.inSubmit = true;
        }
    }
    // end save

    // confirm escape
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


// PLUGINS
// plugin object
jQuery.fn.pencase.plugins = {};


