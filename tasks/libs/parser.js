'use strict';

var ATTRS_TYPES = { // Аттрибуты используемые для генерации тестового ID
    NAME: 'name',
    NG_CLICK: 'ng-click',
    NG_MODEL: 'ng-model',
    TRANSLATE: 'translate'
};
var ATTR_TYPE_PRIORITY = getAttrPriority(); // Приоритеты аттрибутов
var fs = require('fs');
var trumpet = require('trumpet');

/**
 * Получение приоритетта аттрибутов
 */
function getAttrPriority() {
    var priority = {};
    
    priority[ATTRS_TYPES.NG_CLICK] = 1;
    priority[ATTRS_TYPES.NAME] = 2;
    priority[ATTRS_TYPES.NG_MODEL] = 3;
    priority[ATTRS_TYPES.TRANSLATE] = 4;
    
    return priority;
}

function isValue(v) {
    return v !== null && v !== undefined;
}

function isUndefined(v) {
    return v === undefined;
}

function isObject(v) {
    return isValue(v) && v.constructor === Object;
}

function isFunction(v) {
    return isValue(v) && v.constructor === Function;
}

function isArray(v) {
    return isValue(v) && v.constructor === Array;
}

function isRegExp(v) {
    return isValue(v) && v.constructor === RegExp;
}

function isString(v) {
    return isValue(v) && v.constructor === String;
}

function isRegExpOrString(v) {
    return isString(v) || isRegExp(v);
}

function Parser(grunt, options, file) {
    this.fileName = file.replace(/.+\/(.+)\.html$/, '$1');
    this.grunt = grunt;
    this.options = options;
    this.pipeline = [];
    this.tags = 'button, a, input, *[ng-click]';
    this.testAttr = 'test-id';
    
    this.createPipeline();
}

Parser.prototype = {
    constructor: Parser,
    fileName: null,
    grunt: null,
    options: null,
    pipeline: null,
    tags: null,
    testAttr: null
};

Parser.prototype.getNewTestAttribute = function (elem) {
    var self = this;
    var attrs = elem.getAttributes();
    var attr = getAttrForTestId(attrs);
    
    return getTestId(attr, attrs[attr]);
    
    function getAttrForTestId(attrs) {
        var attrNames = Object.keys(attrs);
        var i = attrNames.length;
        var currentAttr = '';
        while (i--) {
            if (ATTRS_TYPES.NAME === attrNames[i] && (!currentAttr || ATTR_TYPE_PRIORITY[ATTRS_TYPES.NAME] > ATTR_TYPE_PRIORITY[currentAttr])) {
                currentAttr = attrNames[i];
            } else if (ATTRS_TYPES.NG_CLICK === attrNames[i] && (!currentAttr || ATTR_TYPE_PRIORITY[ATTRS_TYPES.NG_CLICK] > ATTR_TYPE_PRIORITY[currentAttr])) {
                currentAttr = attrNames[i];
            } else if (ATTRS_TYPES.NG_MODEL === attrNames[i] && (!currentAttr || ATTR_TYPE_PRIORITY[ATTRS_TYPES.NG_MODEL] > ATTR_TYPE_PRIORITY[currentAttr])) {
                currentAttr = attrNames[i];
            } else if (ATTRS_TYPES.TRANSLATE === attrNames[i] && (!currentAttr || ATTR_TYPE_PRIORITY[ATTRS_TYPES.TRANSLATE] > ATTR_TYPE_PRIORITY[currentAttr]) && attrs[attrNames[i]] !== true) {
                currentAttr = attrNames[i];
            }
        }
        return currentAttr;
    }
    
    function getTestId(attr, attrValue) {
        var testId = '';
        if (attr === ATTRS_TYPES.NAME) {
            testId = getTestIdFromName(attrValue);
        } else if (attr === ATTRS_TYPES.NG_CLICK) {
            testId = getTestIdFromNgClick(attrValue);
        } else if (attr === ATTRS_TYPES.NG_MODEL) {
            testId = getTestIdFromNgModel(attrValue);
        } else if (attr === ATTRS_TYPES.TRANSLATE) {
            testId = getTestIdFromTranslate(attrValue);
        } else {
            testId = 'noTestId';
        }
        
        return toCamelCase(self.fileName + '.' + testId);
        
        function getTestIdFromName(value) {
            return value.replace(/(vm\.)?/g, '').replace(/\W/g, '.').replace(/\.+/g, '.').replace(/^(\.?)(.*)/, '$2').replace(/(.*)\.$/, '$1');
            //messenger_work_time_new  ->  messenger_work_time_new
            //{{::emoji.name}}  ->  emoji.name
            //linkForDeveloper  -> linkForDeveloper
        }
        
        function getTestIdFromNgClick(value) {
            if (/.\(.*\)\;?$/.test(value)) {
                return value.replace(/^(vm\.)?(\W+)?(vm\.)?(\w+).*/, '$4');
                //$close()  ->  close
                //vm.confirm()  ->  confirm
                //vm.openEmailPreviewModal()  ->  openEmailPreviewModal
                //vm.trackClickActivate(); vm.saveActivate();  ->  trackClickActivate
                //event.userEventsOpen = !event.userEventsOpen; loadGroupEvents(event, null)  ->  event
                //trackClickSendSubscriptionConfirmationEmail(); user.email_status && [EMAIL_STATUSES.CONFIRMED, EMAIL_STATUSES.NOT_CONFIRMED].indexOf(user.email_status.status) != -1 && openSendSubscriptionConfirmationEmailModal();  ->  trackClickSendSubscriptionConfirmationEmail
                //trackClickBanUser(); openBanUserModal(false);  ->  trackClickBanUser
                //writeOneUser('popup_small')  ->  writeOneUser
                //(vm.teamMemberModel.hasPermissions(vm.djangoUser.prefs[vm.currentApp.id].permissions, teamMember.permissions) && teamMember.id != vm.currentTeamMember.id) && (vm.trackClickEditTeamMember() || vm.openEditTeamMemberModal(teamMember))  ->  teamMemberModel
                //!vm.isPreviewShown && vm.onPopupBlockClick({popupBlock: vm.popup.bodyJson.footer})  ->  isPreviewShown
                //vm.trackClickGetDemo(); vm.sendChatMessage('conversationsStatisticsPaywall.getDemoButton.chatMessage' | translate);  ->  trackClickGetDemo
            } else {
                return value.replace(/^(vm\.)?(\$\w+)?\W?(\w+).*/, '$3');
                //vm.isAppExists = !vm.isAppExists  -> isAppExists
                //propsEdit[prop.key] = !propsEdit[key]  -> propsEdit
                //systemEdit.$phone = !systemEdit.$phone  ->  systemEdit
                //$parent.newUserNote = {}  ->  newUserNote
                //newProp._edit = true  ->  newProp
                //segmentsExpand = !segmentsExpand  ->  segmentsExpand
                //vm.extraPropertiesIsCollapsed = !vm.extraPropertiesIsCollapsed  ->  extraPropertiesIsCollapsed
                //vm.onboardingStatuses[step.name].collapsed = !vm.onboardingStatuses[step.name].collapsed  ->  onboardingStatuses
                //$event.stopPropagation(); vm.openRemoveModal(vm.template); vm.isOpen = false  ->  stopPropagation
                //event.propsOpened = !event.propsOpened && event.propsArray.length && event.type.name != '$user_merged'  ->  propsOpened
                //propsEdit[prop.key] = !propsEdit[key]  ->  propsEdit
            }
            
        }
        
        function getTestIdFromNgModel(value) {
            return value.replace(/(vm\.)?/g, '').replace(/\W/g, '.').replace(/\.+/g, '.').replace(/^(\.?)(.*)/, '$2').replace(/(.*)\.$/, '$1');
            //vm.messagePart.type  ->  messagePart.type
            //question.checked  ->  question.checked
            //vm.channel  ->  channel
            //vm.chatSettings.messenger_auto_reply_show_config.not_work_enabled  ->  chatSettings.messenger_auto_reply_show_config.not_work_enabled
            //automaticReplyItem.strings[lang][tab].phone_unknown  ->  automaticReplyItem.strings.lang.tab.phone_unknown
            //$parent.$parent.$parent.promoCode  ->  parent.parent.parent.promoCode
        }
        
        function getTestIdFromTranslate(value) {
            if (/.*(\}\})$/.test(value)) {
                return value.replace(/^(\w+)\..+/, '$1') + '.' + value.replace(/.+\{\{(\:\:)?(vm\.)?(.+)\}\}$/, '$3');
                //general.forward.{{::vm.sdf}}  ->  general.sdf
                //autoMessages.table.messageStatuses.{{::status}}  ->  autoMessages.status
                //general.forward.{{vm.sdf}}  ->  general.sdf
                //autoMessages.table.messageStatuses.{{status}}  ->  autoMessages.status
            } else {
                return value.replace(/^(\w+).*\.(\w+)$/, '$1.$2');
                //header.templates.systemLogPopover.zeroData.haveNoSystemLogMessages  ->   header.haveNoSystemLogMessages
                //general.forward  ->  general.forward
            }
        }
        
        function toCamelCase(value) {
            return value.replace(/-(.)/g, toUpperCase).replace(/_(.)/g, toUpperCase);
            
            function toUpperCase(entry, match) {
                return match.toUpperCase();
            }
        }
    }
};

Parser.prototype.createPipeline = function () {
    var self = this;
    
    var tr = trumpet();
    tr.selectAll(this.tags, function (elem) {
        var newAttr;
        
        newAttr = self.getNewTestAttribute(elem);
        // set the new attribute
        
        elem.setAttribute(self.testAttr, newAttr);
    });
    
    tr.on('error', function (e) {
        self.grunt.log.warn('Error Parsing html - ' + e);
    });
    
    this.pipeline.push(tr);
};

Parser.prototype.process = function (file, done) {
    var src = file.src, dest = file.dest, istream, ostream;
    
    // validate the file source and destination
    
    if (!src || src.length !== 1) {
        if (!src) {
            return this.grunt.fail.warn('Исходный файл не предоставлен');
        } else {
            return this.grunt.fail.warn('Ожидался 1 файл, но найдено ' + src.length + ': ' + src.join(', '));
        }
    }
    
    // add handling for no destination here
    
    if (!this.grunt.file.exists(dest)) {
        this.grunt.file.write(dest, '');
    }
    
    istream = fs.createReadStream(src[0]);
    ostream = fs.createWriteStream(dest);
    
    ostream.on('close', done);
    
    this.pipeline.reduce(function (p, e) {
        return p.pipe(e);
    }, istream).pipe(ostream);
};

module.exports = Parser;