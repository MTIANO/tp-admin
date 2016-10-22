/*左侧从菜单*/

$(function() {
    win.start();
    $(document).ready(function() {
        $('.admin-menu-parent').find('.admin-menu-dropdown-toggle').click(function() {
            var $this = $(this)
            var menuList = $this.parent().parent();

            menuList.find('.admin-menu-parent').each(function(index, value) {
                var exists = $(this).find('botton').hasClass('admin-menu-botton')
                if (exists) {
                    $(this).find('botton').removeClass('admin-menu-botton')
                }
            })

            $this.find('#toggle-angle').toggleClass('active')
            $this.addClass('admin-menu-botton')
            $this.siblings('ul').slideToggle('slow')
        });

        //菜单选中样式
        $('.sub_button').each(function() {
            var href = $(this).find('a').attr('href')
            var loc = String(window.location.pathname)
            if (href == loc) {
                $(this).parent().siblings('botton').addClass('admin-menu-botton')
                $(this).addClass('menu-active')
            }
        })
    });
});


// 常用函数封装
window.win = {
    menuSelector: '',
    headerSelector: '',
    start: function() {
        this.globalAjax();
        this.init('body');
    },
    init: function(selector) {
        selector = $(selector);
        this.validate(selector.find('form[data-validate="true"]'));

        var $form = selector.find('form[data-submit="ajax"]');
        $form.each(function(i, item) {
            if ($form.eq(i).data('validate') == true) {
                return true;
            }

            $form.eq(i).on('submit', function() {
                $form.eq(i).ajaxSubmit();
                return false;
            });
        });

        this.initDate(selector.find('.input-append.date'));
        selector.find('.btn-back').on('click', function() { win.back();
            return false; });

        this.bootstrapTable(selector.find('table[data-toggle="table"]'));

        selector.find('.input-append.file').each(function(i, item) {
            win.ajaxFileUpload(item);
        });
    },
    empty: function(obj) {
        if (obj === undefined || obj === null || obj === '') {
            return true;
        }

        var type = typeof(obj);
        if (type === 'object') {
            for (var i in obj) {
                return false;
            }

            return true;
        }

        if (type === 'string' && $.trim(obj) === '') {
            return true;
        }

        return false;
    },
    redirect: function(url, time) {
        if (url == undefined || url == '') {
            return;
        }

        if (time == undefined) {
            window.location.href = url;
        } else {
            setTimeout(function() {
                window.location.href = url;
            }, time);
        }
    },
    modal: function(url) {
        $.ajax({
            url: url,
            dataType: 'html',
            success: function(html) {
                var $html = $('<div>' + html + '</div>');

                var $modal = $html.find('.modal:eq(0)');
                if ($modal.length == 0) {
                    alertMsg(html);
                    return;
                }

                $html.appendTo('body');
                win.init($html);
                $modal.modal().show();
                $modal.on('hide', function() {
                    $html.remove();
                });
            }
        });
    },
    back: function(steep) {
        location.href = document.referrer;
    },
    globalAjax: function() {
        $.ajaxSetup({
            waitting: false,
            $msg_box: null,
            beforeSend: function(XHR) {
                if ((this.type == 'POST' && this.waitting != false) || this.waitting != false) {
                    if (true == this.waitting || this.waitting == '') {
                        this.waitting = '请稍后...';
                    }
                    if (this.waitting != undefined) {
                        this.$msg_box = alertMsg(this.waitting, -1);
                    }
                }

                this.custom = {};
                this.custom.success = this.success;
                this.custom.error = this.error;
                this.custom.complete = this.complete;

                this.success = function(data, textStatus, jqXHR) {
                    var response_type = jqXHR.getResponseHeader("Content-Type");
                    if (this.dataType != 'json' && response_type != 'application/json; charset=utf-8') {
                        if (typeof this.custom.success == 'function') {
                            this.custom.success(data, textStatus, jqXHR);
                        }
                        return;
                    }

                    // 我请求的不是json数据，而返回的却是json数据(可能服务端出错)
                    if (this.dataType != 'json' && response_type == 'application/json; charset=utf-8') {
                        data = $.parseJSON(data);
                    }

                    if (typeof data.info == 'string' && data.info != '') {
                        alertMsg(data.info);
                    }

                    if (!win.empty(data.url)) {
                        return win.redirect(data.url, 2);
                    }

                    if (!win.empty(data.status)) {
                        if (data.status == 1) {
                            if (typeof this.custom.success == 'function') {
                                return this.custom.success(typeof data.info == 'object' ? data.info : {}, textStatus, jqXHR);
                            } else {
                                return;
                            }
                        } else if (data.status == 0) {
                            if (typeof this.custom.error == 'function') {
                                if (typeof data.info == 'object') {
                                    alertMsg('操作失败！', 'warning');
                                    return this.custom.error(data.info, textStatus, jqXHR);
                                } else {
                                    return this.custom.error({}, textStatus, jqXHR);
                                }
                            } else {
                                return;
                            }
                        }
                    } else if (typeof this.custom.success == 'function') {
                        this.custom.success(data, textStatus, jqXHR);
                    }
                };
                this.error = function(data, textStatus, jqXHR) {
                    if (typeof this.custom.error == 'function') {
                        this.custom.error({}, textStatus, jqXHR);
                    } else {
                        alertMsg('网络连接失败，请稍后再试！', 'error');
                    }
                };
                this.complete = function(XHR, TS) {
                    if (this.$msg_box != null) {
                        this.$msg_box.remove();
                    }
                    if (typeof this.custom.complete == 'function') {
                        this.custom.complete(XHR, TS);
                    }

                    if (typeof this.dialog == 'object') {
                        this.dialog.remove();
                    }
                };
            }
        });
    },
    getScript: function(url, fn) { // 下载js
        $.ajax({
            url: url,
            dataType: "script",
            cache: true,
            success: function(data, str) {
                if (typeof fn == 'function') {
                    fn();
                }
            }
        });
    },
    getStyle: function(url) { // 下载样式
        var style = $('link[href="' + url + '"]');
        if (style.length > 0) {
            return;
        }

        $('head').append('<link rel="stylesheet" href="' + url + '">');
    },
    initDate: function(selector) {
        var $selector = $(selector);
        if ($selector.length == 0) {
            return;
        }
        if (typeof $.fn.datetimepicker == 'undefined') {
            // win.getStyle('/bootstrap2.3.2/css/bootstrap-datetimepicker.min.css');
            // win.getScript('/bootstrap2.3.2/js/bootstrap-datetimepicker.min.js', function() {
            //     win.initDate($selector);
            // });
            return;
        }

        zh_date();

        $selector.each(function(i, item) {
            /*
            // bootstrap官网提供的日期控件用法
            $selector.eq(i).datetimepicker({
            	weekStart: 1,
                autoclose: true,
                zIndex:99999,
                format: $selector.eq(i).data('dateFormat') || 'yyyy-mm-dd',
                startDate: $selector.eq(i).data('startDate'),
                endDate: $selector.eq(i).data('endDate'),
                startView: $selector.eq(i).data('startView') || 'month',
            	minView: $selector.eq(i).data('minView') || 'month',
            	maxView: $selector.eq(i).data('maxView') || 'decade',
                todayBtn:$selector.eq(i).data('todayBtn') || false,
                todayHighlight: true,
                minuteStep: $selector.eq(i).data('minuteStep') || 1,
                language: 'zh-CN'
            });
            */

            // bootstrap 扩展的日期控件用法
            $selector.eq(i).datetimepicker({
                format: $selector.eq(i).data('dateFormat') || "yyyy-MM-dd",
                pickDate: $selector.eq(i).data('pickDate') || true,
                pickTime: $selector.eq(i).data('pickDate') || true,
                startDate: $selector.eq(i).data('startDate') ? new Date($selector.eq(i).data('startDate')) : null,
                endDate: $selector.eq(i).data('endDate') ? new Date($selector.eq(i).data('endDate')) : null,
                language: 'zh-CN'
            });
        });
    },
    validate: function(object) { // jquery.validate验证
        var $form = $(object);
        if ($form.length == 0) {
            return;
        }

        if (typeof $.fn.validate == 'undefined') {
            this.getScript('/js/admin/jquery.validate.min.js', function() {
                win.validate($form);
            });
            return;
        }

        zh_validator();

        $form.each(function(i, form) {
            $form.eq(i).validate({
                errorClass: $form.eq(i).data('errorClass') == undefined ? "help-inline" : $form.eq(i).data('errorClass'),
                errorElement: "span",
                ignore: ".ignore",
                highlight: function(element, errorClass, validClass) {
                    var $element = $(element);
                    $element.parents('.control-group:eq(0)').addClass('error');
                    $element.parents('.control-group:eq(0)').removeClass('success');
                },
                unhighlight: function(element, errorClass, validClass) {
                    var $element = $(element);
                    if ($element.attr('aria-invalid') != undefined) {
                        $element.parents('.control-group:eq(0)').removeClass('error');
                        $element.parents('.control-group:eq(0)').addClass('success');
                    }
                },
                errorPlacement: function($error, $element) {
                    if ($element[0].tagName == 'SELECT' && $error.text() == '必须填写') {
                        $error.html('必须选择');
                    }

                    var $parent = $element.parent();
                    if ($parent.hasClass('input-append')) {
                        $error.insertAfter($parent);
                    } else {
                        if (this.errorClass == 'help-inline') {
                            $error.insertAfter($element);
                        } else {
                            $error.appendTo($element.parents('.controls:eq(0)'));
                        }
                    }
                },
                submitHandler: function() {
                    var result = $form.eq(i).triggerHandler('valid');
                    if (result === false) {
                        return false;
                    }
                    if ($form.eq(i).data('submit') == 'ajax') {
                        $form.eq(i).ajaxSubmit();
                        return false;
                    }
                    return true;
                }
            });
        });
    },
    bootstrapTable: function(object) {
        var $table = $(object);
        if ($table.length == 0) {
            return;
        }

        if (typeof $.fn.bootstrapTable != 'function') {
            var $win = this;
            this.getStyle('/css/admin/bootstrap-table.css');
            this.getScript('/js/admin/bootstrap-table.js', function() {
                $win.bootstrapTable($table);
            });
            return;
        }

        zh_table();
        $table.bootstrapTable();
    },
    ajaxFileUpload: function($append) {
        if (typeof $.ajaxFileUpload != 'function') {
            var $win = this;
            this.getScript('/js/ajaxfileupload.js', function() {
                $win.ajaxFileUpload($append);
            });
            return;
        }

        $append = $($append);
        var $input_str = $append.children('input[type="text"]');
        $input_str.attr('readonly', 'readonly');

        var file_id = newId(16);
        var $addOn = $append.find('.add-on');
        var file_type = $append.attr('data-type') || 'image';
        var $file = $('<input type="file" id="' + file_id + '" name="upfile" />');
        $file.appendTo($addOn);

        $file.on('change', function() {
            $.ajaxFileUpload({
                url: '/admin/ueditor?action=upload' + file_type,
                type: 'post',
                secureuri: false, //一般设置为false
                fileElementId: file_id, // 上传文件的id、name属性名
                dataType: 'json', //返回值类型，一般设置为json、application/json
                success: function(data, status) {
                    if (data.status == 0) {
                        alertMsg(data.info);
                    } else {
                        $input_str.val(data.url);
                        if (file_type == 'image') {
                            $addOn.data('popover').options.content = '<img src="' + data.url + '" style="width:128px; height: 128px;" />';
                        }
                    }
                },
                error: function(data, status, e) {
                    alertMsg('上传文件失败！');
                }
            });
        });

        if (file_type == 'image') {
            $addOn.popover({
                html: true,
                placement: 'bottom',
                title: '图片预览',
                content: '<img src="' + $input_str.val() + '" style="max-width:128px;" />',
                trigger: 'hover'
            });

            var aaa;
        }
    }
};

/** */
function newId(length) {
    if (length == undefined) {
        length = 10;
    }
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var str = "";
    for (var i = 0; i < length; i++) {
        str += chars.substr(Math.ceil(Math.random() * chars.length), 1);
    }
    return str;
}

//jquery扩展ajax提交表单
$.fn.ajaxSubmit = function() {
    var $form = this;
    var $submit = $form.find(':submit');
    $submit.attr('disabled', true).toggleClass('btn-primary');

    $.ajax({
        url: $form.attr('action'),
        type: $form.attr('method'),
        data: $form.serialize(),
        dataType: 'json',
        success: function(data, str) {
            $form.data('submited', true);
            var result = $form.triggerHandler('submited', [data, str]);
            if (result == false) {
                return false;
            }

            var form_success = $form.data('success');

            // 表单提交后操作
            if (!win.empty(data.url)) { // 跳转到其他页面
                win.redirect(data.url, 2000);
            } else if (data.continues) { // 继续填写表单
                alertConfirm({
                    okValue: '继续',
                    content: '是否继续填写？',
                    ok: function() {
                        form.reset();
                        $submit.removeAttr('disabled', false).toggleClass('btn-primary');
                        $form.find('.control-group').removeClass('success');
                    },
                    cancel: function() {
                        var $modal = $form.children('.modal');
                        if ($modal.length > 0) {
                            $modal.modal('hide');
                            $submit.removeAttr('disabled', false).toggleClass('btn-primary');
                            $form.find('.control-group').removeClass('success');
                        } else if (form_success == 'back') { // 返回上一页
                            win.back();
                        } else if (form_success == 'refresh') { // 刷新本页
                            window.location.reload();
                        } else {
                            $submit.removeAttr('disabled', false).toggleClass('btn-primary');
                            $form.find('.control-group').removeClass('success');
                        }

                        return false;
                    }
                });
            } else if (form_success == 'back') { // 返回上一页
                win.back(-1);
            } else if (form_success == 'refresh') { // 刷新本页
                window.location.reload();
            } else {
                var $modal = $form.children('.modal');
                if ($modal.length == 0) {
                    if ($form.hasClass('modal')) {
                        $modal = $form;
                    } else {
                        var $parent = $form.parent();

                        if ($parent.hasClass('modal')) {
                            $modal = $parent;
                        }
                    }
                }

                if ($modal.length > 0) {
                    $modal.modal('hide');
                }
                $submit.removeAttr('disabled', false).toggleClass('btn-primary');
                $form.find('.control-group').removeClass('success');
            }
        },
        error: function(data) {
            $submit.removeAttr('disabled', false).toggleClass('btn-primary');
        },
        complete: function(data) {}
    });

    return this;
};

//** 弹出提示信息 **//
function alertMsg(content, time) {
    var option = { title: false, content: '', time: 3, status: 'info' };
    if (typeof content == 'object') {
        option = $.extend(option, content);
    } else if (typeof content == "string") {
        option.content = content;
    }

    if (time != undefined && time != '' && !isNaN(time)) {
        option.time = time;
    } else if (typeof time == 'string' && (time == 'info' || time == 'success' || time == 'error' || time == 'warning')) {
        option.status = time;
    }

    var html = '<div id="msg_box_div" style="position:fixed;left:20%;right:20%; top: -25%;z-index:9999;text-align: center;-webkit-transition: opacity .3s linear,top .3s ease-out; -moz-transition: opacity .3s linear,top .3s ease-out;-o-transition: opacity .3s linear,top .3s ease-out;transition: opacity .3s linear,top .3s ease-out;">';
    html += '	<div class="alert alert-' + option.status + '" style="display:inline-block; padding:4px 20px 4px 20px;margin: 0;">';
    if (option.title != undefined && option.title !== false && option.title != '') {
        html += '		<h4>' + option.title + '</h4>';
    }
    html += '		' + option.content;
    html += '	</div>';
    html += '</div>';

    if (option.time > 0) {
        $('#msg_box_div').remove();
    }

    var $msg_box = $(html);
    $msg_box.appendTo('body');

    setTimeout(function() {
        $msg_box.css('top', '60px');
    }, 10);

    if (option.time > 0) {
        var timer = setTimeout(function() {
            $msg_box.remove();
        }, option.time * 1000 + 60);

        $('#msg_box_div').hover(function() {
            window.clearTimeout(timer);
        }, function() {
            timer = setTimeout(function() {
                $msg_box.remove();
            }, option.time * 1000 + 60);
        });
    }

    return $msg_box;
}

/** 弹出确认提示框 */
function alertConfirm(_option, ok) {
    if (typeof _option == 'string') {
        _option = { content: _option };
        if (typeof ok == 'function') {
            _option.ok = ok;
        }
    }

    option = jQuery.extend({
        title: '提示',
        content: '',
        okValue: '确定',
        ok: function() {},
        cancelValue: '取消',
        backdrop: $('body').find('.modal-backdrop').length == 0,
        cancel: function() {}
    }, _option);

    var html = '';
    html += '<div class="modal modal-mini hide fade" tabindex="-1" role="dialog">';
    html += '	<div class="modal-header">';
    html += '		<button type="button" class="close" data-dismiss="modal">×</button>';
    html += '		<h3 id="myModalLabel">' + option.title + '</h3>';
    html += ' 	</div>';
    html += '  <div class="modal-body" style="text-align:center;">' + option.content + '</div>';
    html += '  <div class="modal-footer">';
    html += '    <button class="btn" data-dismiss="modal">' + option.cancelValue + '</button>';
    html += '    <button class="btn btn-primary">' + option.okValue + '</button>';
    html += '  </div>';
    html += '</div>';

    var visibled_modal = $('.modal:visible');
    visibled_modal.hide();

    var mydialog = $(html);
    mydialog.appendTo('body');
    mydialog.modal({
        backdrop: option.backdrop
    }).show();

    mydialog.find('button[data-dismiss="modal"]').on('click', function() {
        var go = option.cancel();
        if (go != false) {
            visibled_modal.show();
        }
        setTimeout(function() {
            mydialog.remove();
        }, 600);
    });
    mydialog.find('.btn-primary').on('click', function() {
        option.ok();
        mydialog.modal('hide');
        visibled_modal.show();
    });
}

/**
 * 修改密码
 */
function modifyPwd() {
    win.modal('/admin/index/modifyPwd');
}

function getImageTextHtml(data) {
    var url = data.url;
    var html = '<div class="media_preview_area" data-appmsg-id="' + data.id + '"><div class="appmsg' + (!data.children ? '' : ' multi') + '"><div class="appmsg_content">';

    var appmsg = data;
    if (data.children) {
        var index = 0;
        do {
            url = appmsg.url;
            html += '<div class="appmsg_item js_appmsg_item has_thumb">';
            html += '<img class="js_appmsg_thumb appmsg_thumb" src="' + appmsg.cover + '">';
            html += '<h4 class="appmsg_title">';
            html += '<a href="' + url + '">' + appmsg.title + '</a>';
            html += '</h4>';
            html += '</div>';
            appmsg = data.children[index];
            index++;
        } while (appmsg);
    } else {
        html += '<h4 class="appmsg_title js_title"><a href="' + url + '" target="_blank">' + appmsg.title + '</a></h4>';
        html += '<div class="appmsg_info">';
        html += '	<em class="appmsg_date">' + appmsg.create_time + '</em>';
        html += '</div>';
        html += '<div class="appmsg_thumb_wrp">';
        html += '	<img src="' + appmsg.cover + '" alt="封面" class="appmsg_thumb">';
        html += '</div>';
        html += '<p class="appmsg_desc">dssds</p>';
    }

    html += '</div></div></div>';
    return html;
}