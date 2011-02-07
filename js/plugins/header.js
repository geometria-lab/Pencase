// Pencase header plugin

jQuery.fn.pencase.words.h_header = 'Header'; 

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