// Pencase video plugin

jQuery.fn.pencase.words.h_video = 'Video';

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