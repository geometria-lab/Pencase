// Pencase image plugin

jQuery.fn.pencase.words.h_image = 'Image';

jQuery.fn.pencase.plugins.image = {
    isDefault : true,
    serialize:function(el){
        var box = $('.pencase-image-picBox', el),
            img = $('img', box),
            text = $.trim( $('input', box).val() ),
            picVal = {},
            src = $.trim( img.attr('src') );
        if( src.length ){
            picVal.src = src;
            if(text.length && text != jQuery.fn.pencase.words['description'] ){
                picVal.description = text;
            }
            return  picVal;
        }
    },
    validate: function(el){
        var val = this.serialize(el);
        if(val && val.description && val.description.length > 255){
            return jQuery.fn.pencase.words['descriptionError'];
        }
    },
    setValues: function(val, createImage, areaWrap){
        var imageBlock = createImage(val.src,  val.description);
        $('img', imageBlock).attr('src', val.src);
        areaWrap.html(imageBlock);
    },
    init : function(el, blockObj) {
        var $ = jQuery,
            pencil = jQuery.fn.pencase,
            doneText = pencil.words['insertVideoButton'],
            errorText = pencil.words['error'] || 'Error',
            defaultText = pencil.words['insertImageText'],
            box = $('<div class="pencase-block-image-box"/>'),
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

        function createImage(src, description){
            var defaultText = jQuery.fn.pencase.words['description'],
                block = $( [
                    '<div class="pencase-image-picBox">',
                       '<div class="pencase-image-picWrap">',
                            '<img alt=""/>',
                       '</div>',
                       '<input type="text" '+ ( description ? '' : 'class="default"' ) +' value="'+ ( description ? description : defaultText ) +'">',
                    '</div>'
                ].join('') ),
                input = $('input', block);

            input
                .focus(function(){
                    if($.trim( input.val() ) == defaultText ){
                        input.val('').removeClass('default');
                    }
                })
                .blur(function(){
                    if($.trim( input.val() ) == '' ){
                        input.val(defaultText).addClass('default');
                    }
                });
            return block;
        }

        function addImageAction(src, description){
            var imageBlock = createImage(src, description);

            areaWrap.html( jQuery.fn.pencase.words['load'] );

            $('img', imageBlock).load(function(){
                areaWrap.html(imageBlock);
            }).attr('src', src); // important for Opera
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
            this.setValues(blockObj.value, createImage, areaWrap);
        }
    }
}
