var design = {};
var utils = {};

$(function() {
    var state = {
        terms: null
    };

    utils = {
        collapseAllIntroDoc: function(e) {
            $('.doc.intro').addClass('collapsed');
        },
        expandAllIntroDoc: function(e) {
            $('.doc.intro').removeClass('collapsed');
        },
        collapseIntroDoc: function(e) {
            var $doc = $(e.target).closest('.doc');
            var key = $doc.data('key');
            $('.doc[data-key='+key+']').toggleClass('collapsed');
            e.stopPropagation();
        },
        expandIntroDoc: function(e) {
            var $doc = $(e.target).closest('.doc');
            if (!$doc.hasClass('collapsed')) return;
            e.stopPropagation();
            var key = $doc.data('key');
            $('.doc[data-key='+key+']').removeClass('collapsed');
        },
        setUpExpandCollapse: function($container) {
            $container.find('.doc.intro').append($('<div>').addClass('remove').click(utils.collapseIntroDoc));
            $container.find('.doc.intro').click(utils.expandIntroDoc);
        },
        processDocs: function($root) {
            var $docs = $root ? $root.find('.doc.disp') : $('.doc.disp');
            $docs.each(function(i, e) {
                var $doc = $(e);
                var key = $doc.data('key');
                $.ajax({
                    url: '/doc/' + key,
                    success: function(html) {
                        var insertIdx = html.indexOf('<p>[[[');
                        while (insertIdx >= 0) {
                            var preHtml = html.substring(0, insertIdx);
                            var $subCt = $('<div>').addClass('ct').html(preHtml);
                            utils.processDocContent($subCt);
                            $doc.append($subCt);
                            var html = html.substring(insertIdx);
                            var endIdx = html.indexOf(']]]</p>');
                            if (endIdx >= 0) {
                                var $target = $(html.substring(6, endIdx));
                                $doc.after($target);
                                $doc = $doc.clone().html('');
                                $target.after($doc);
                                html = html.substring(endIdx + 7);
                            }
                            insertIdx = html.indexOf('<p>[[[');
                        }
                        if (html.trim().length > 0) {
                            var $ct = $('<div>').addClass('ct').html(html);
                            $doc.append($ct);
                            utils.processDocContent($ct);
                        }
                        utils.setUpExpandCollapse($doc.parent());
                    }
                });
            });
        },
        processDocContent: function($ct) {
            if (!state.terms) return;
            $ct.find('code').each(function(i, e) {
                var $e = $(e);
                var term = $e.text().toLowerCase();
                var def = state.terms[term];
                if (!def) return;
                $e.tooltip({
                    placement: 'top',
                    title: def
                });
            });
        },
        checkOperators: {
            '<' : function(a, b) { return a < b; },
            '>' : function(a, b) { return a > b; },
            '<=' : function(a, b) { return a <= b; },
            '>=' : function(a, b) { return a >= b; },
            '==' : function(a, b) { return a === b; },
            '!=' : function(a, b) { return a !== b; }
        },
        designCheck: function(check) {
            if (check.indexOf('&&') >= 0) {
                var checks = check.split('&&');
                var ok = true;
                for (var i = 0; ok && i < checks.length; i++) {
                    ok = ok && utils.designCheck(checks[i]);
                }
                return ok;
            }

            check = check.trim();
            var checkPieces = /([\S]+) *([<>=!]) *([\S]+)/.exec(check);
            var checkElem = design[checkPieces[1]];
            if (_.isNil(checkElem)) return false;
            var op = utils.checkOperators[checkPieces[2]];
            if (_.isNil(op)) return false;
            var val = checkPieces[3];
            if (_.isNumber(checkElem)) {
                return op(checkElem, _.toNumber(val));
            } else {
                return op(checkElem, val);
            }
        },
        updateDesign: function(attr, value) {
            design[attr] = value;
            $('[data-hide]').each(function(i,e) {
                var check = $(e).data('hide');
                $(e).toggle(!utils.designCheck(check));
            });
            $('[data-disable]').each(function(i,e) {
                var check = $(e).data('disable');
                $(e).attr('disabled', utils.designCheck(check));
            });
        }
    };

    $('#compress-all').click(utils.collapseAllIntroDoc);
    $('#expand-all').click(utils.expandAllIntroDoc);

    $.ajax({
        url: '/doc/terms',
        success: function(data) {
            state.terms = data;
            utils.processDocContent($('.doc'));
        }
    });

    utils.processDocs();
    $('.include').each(function(i, e) {
        var $e = $(e);
        $.ajax({
            url: '/section/' + $e.data('section') + '.html',
            success: function(html) {
                var $html = $(html);
                $e.replaceWith($html);
                utils.processDocs($html);
            }
        });
    });
});