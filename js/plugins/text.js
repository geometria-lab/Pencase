// Pencase simple text plugin

jQuery.fn.pencase.words.h_text = 'Text';

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