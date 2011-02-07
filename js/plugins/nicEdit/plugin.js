// Pencase nicEdit plugin

jQuery.fn.pencase.words.h_nicEdit = 'NicEdit';

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
            if($.browser.msie){
                area.css('width', ( area.innerWidth() - 2 ) + 'px' );
                area.css('height', area.innerHeight() + 'px' ); 
            }
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