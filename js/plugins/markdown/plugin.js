 //Markdown plugin

jQuery.fn.pencase.words.h_markDown = 'Markdown';

jQuery.fn.pencase.pluginMarkdownWords = {
    strong: "strong text",
    em: "italic text",
    ins: "emphasized text",
    linkText: "link text",
    linkHref: "http://example.ru/",
    linkTitle: "Title",
    listItem: "list item"
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
            editor = new markdownEditor(ereaEl),
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
                    if($.browser.msie){ e.cancelBubble(); } // Important for focus in area in IE 
                });
            })(x);
            butBox.append(but);
        }

        el.append(mainBox).append(previewBox);

        function updateSize(){
            if(!$.browser.msie){
                area.css('height', 'auto');
            }
            var height = parseInt( ereaEl.scrollHeight ) + 20 ;
            box.css('height', (height + 5) +'px');
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
        }
    }
}