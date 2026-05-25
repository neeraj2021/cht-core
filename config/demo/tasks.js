// module.exports = [
//   {
//     name: 'phq9-followup',
//     title: 'PHQ-9 Follow-up',
//     icon: 'icon-healthcare',
//     appliesTo: 'reports',
//     appliesToType: ['phq9'],
//     appliesIf: function(c, r) {
//       // Only apply to reports where source is not 'task'
//       // This prevents a follow-up from triggering another follow-up
//       console.log(c.reports, 'Hello Worlssss');
//       if (r.fields && r.fields.source === 'task') {
//         return false;
//       }
//       // // Only generate a task for the most recent original PHQ-9 report
//       // // This prevents multiple open tasks when a contact has several PHQ-9s
//       var mostRecent = Utils.getMostRecentReport(r.reports, 'phq9');
//       return mostRecent && mostRecent._id === r._id;
//       // return true;
//     },
//     actions: [
//       {
//         type: 'report',
//         form: 'phq9',
//         label: 'Fill PHQ-9',
//         // Removed unused (c, r, event) to pass linting
//         modifyContent: function(content) {
//           content.source = 'task';
//         }
//       }
//     ],
//     events: [
//       {
//         id: 'phq9-followup-event',
//         dueDate: function(event, c, r) {
//           return Utils.addDate(new Date(r.reported_date), 1);
//         },
//         start: 0,
//         end: 3,
//       }
//     ],
//     resolvedIf: function(c, r, event, dueDate) {
//       return Utils.isFormSubmittedInWindow(
//         c.reports,
//         'phq9',
//         Utils.addDate(dueDate, -event.start).getTime(),
//         Utils.addDate(dueDate, event.end + 1).getTime()
//       );
//     }
//   }
// ];


// module.exports = [
//   {
//     title: 'task.phq9_followup',
//     name: 'phq9-followup',
//     appliesTo: 'reports',
//     appliesToType: ['phq9'],
//     actions: [{ form: 'phq9' }],
//     events: [
//       { id: 'phq9-followup-1', days: 7, start: 0, end: 7 }
//     ],
//     resolvedIf: function (contact, report, event, dueDate) {
//       return Utils.isFormSubmittedInWindow(
//         contact.reports,
//         'phq9',
//         Utils.addDate(dueDate, -event.start).getTime(),
//         Utils.addDate(dueDate, event.end + 1).getTime()
//       );
//     }
//   }
// ];


// module.exports = [

//   {

//     name: 'follow-up-after-report',

//     title: 'Follow Up',

//     appliesTo: 'reports',

//     appliesToType: ['phq9'], // replace with your form's code

//     appliesIf: function (contact, report) {

//       // optional: add conditions to filter which reports trigger the task
//       console.log(contact.reports, 'Contactssss');
//       console.log(report.reports, 'Reportsssss');

//       return true;

//     },

//     resolvedIf: function (contact, report, event, dueDate) {

//       return Utils.isFormSubmittedInWindow(

//         contact.reports,

//         'phq9',

//         Utils.addDate(dueDate, -event.start).getTime(),

//         Utils.addDate(dueDate, event.end + 1).getTime()

//       );

//     },

//     actions: [{ form: 'phq9' }],

//     events: [

//       {

//         id: 'follow-up-event',

//         days: 0,   // due 7 days after the report's reported_date

//         start: 0,  // show 2 days before due date

//         end: 2,    // show 2 days after due date

//       }

//     ]

//   }

// ];
 
// module.exports = [
//   {
//     name: 'follow-up-after-report',
//     title: 'Follow Up',
//     appliesTo: 'reports',
//     appliesToType: ['phq9'],
 
//     appliesIf: function (contact, report) {
//       console.log('Triggered for report:', report.form);
//       return true;
//     },
 
//     resolvedIf: () => false,
 
//     actions: [{ form: 'phq9' }],
 
//     events: [
//       {
//         id: 'follow-up-event',
//         days: 0,
//         start: 0,
//         end: 2,
//       }
//     ]
//   }
// ];

const getField = (report, fieldPath) => ['fields', ...(fieldPath || '').split('.')]
  .reduce((prev, fieldName) => {
    if (prev === undefined) { return undefined; }
    return prev[fieldName];
  }, report);

function isAlive(contact) {
  return contact && contact.contact && !contact.contact.date_of_death;
}



const getNewestReport = function (reports, forms) {
  let result;
  reports.forEach(function (report) {
    if (!forms.includes(report.form)) { return; }
    if (!result || report.reported_date > result.reported_date) {
      result = report;
    }
  });
  return result;
};

function getDateISOLocal(s) {
  if (!s) { return new Date(); }
  const b = s.split(/\D/);
  const d = new Date(b[0], b[1] - 1, b[2]);
  if (isValidDate(d)) { return d; }
  return new Date();
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

const UserRole = Object.freeze({
  ASHA: 'asha',
  CHO: 'cho',
  MPW: 'mpw',
  ANM: 'anm',
  PHYSICIAN: 'physician',
  NURSE: 'nurse',
  MEDICAL_OFFICER: 'medical_officer'
});

module.exports = [
  // {
  //   name: 'phq9.high_score_followup',
  //   icon: 'icon-healthcare-generic-2', 
  //   title: 'PHQ-9 Follow-up Required',
  //   appliesTo: 'reports',
  //   appliesToType: ['phq9'], // Matches form_id in your settings.csv
  //   // appliesIf: function(contact, report) {
  //   //   // Check the score from your PHQ-9 form submission
  //   //   // Ensure 'total_score' is the exact name in your survey.csv/xml
  //   //   return report.fields.total_score > 13;
  //   // },
  //   appliesIf: function() {
  //     return true;
  //   },
  //   resolvedIf: function(contact, report) {
  //     // Task disappears once this specific follow-up form is submitted
  //     return contact.reports.some(function(r) {
  //       return r.form === 'phq9_followup_actions' && 
  //              r.reported_date >= report.reported_date;
  //     });
  //   },
  //   actions: [
  //     {
  //       type: 'report',
  //       form: 'phq9_followup_actions', // The ID of the form with your 3 questions
  //       modifyContent: function(content, contact, report) {
  //         // Pass the high score to the follow-up form's 'inputs'
  //         content.previous_score = report.fields.total_score;
  //         content.previous_severity = report.fields.severity_category;
  //       }
  //     }
  //   ],
  //   events: [
  //     {
  //       id: 'phq9-immediate',
  //       days: 0,    // Task appears immediately
  //       start: 0,
  //       end: 14     // Stays on the list for 2 weeks or until resolved
  //     }
  //   ]
  // },
  // 2. Breast Cancer Risk Follow-up Task
  // {
  //   name: 'breast_cancer.followup',
  //   icon: 'icon-people-woman', // Matches your properties.json
  //   title: 'Breast Cancer Follow-up Required',
  //   appliesTo: 'reports',
  //   appliesToType: ['breast_cancer_risk_assessment'], // Matches form_id in settings.csv
  //   appliesIf: function() {
  //     return true;
  //   },
  //   resolvedIf: function(contact, report) {
  //     // Assumes your follow-up form for this is named 'bc_followup_actions'
  //     return contact.reports.some(function(r) {
  //       return r.form === 'breast_cancer_followup_actions' && 
  //              r.reported_date >= report.reported_date;
  //     });
  //   },
  //   actions: [
  //     {
  //       type: 'report',
  //       form: 'breast_cancer_followup_actions',
  //       modifyContent: function(content, contact, report) {
  //         // Mapping fields from your breast_cancer_risk_assessment.xlsx survey tab
  //         content.previous_risk_score = report.fields.total_risk_score;
  //         content.previous_risk_category = report.fields.risk_category;
  //       }
  //     }
  //   ],
  //   events: [
  //     {
  //       id: 'bc-immediate',
  //       days: 0,
  //       start: 0,
  //       end: 14 
  //     }
  //   ]
  // },
  // 3. Oral Cancer Assessment Follow-up Task
  // {
  //   name: 'oral_cancer.followup',
  //   icon: 'icon-disease-cancer', // Matches oral_cancer_assessment.properties.json
  //   title: 'Oral Cancer Follow-up Required',
  //   appliesTo: 'reports',
  //   appliesToType: ['oral_cancer_assessment'], // Matches form_id in settings.csv
  //   appliesIf: function() {
  //     return true;
  //   },
  //   resolvedIf: function(contact, report) {
  //     // Assumes your follow-up form is named 'oral_followup_actions'
  //     return contact.reports.some(function(r) {
  //       return r.form === 'oral_followup_actions' && 
  //              r.reported_date >= report.reported_date;
  //     });
  //   },
  //   actions: [
  //     {
  //       type: 'report',
  //       form: 'oral_followup_actions',
  //       modifyContent: function(content, contact, report) {
  //         // Passing general context as there isn't a single 'score' field in this form
          
  //         content.patient_age = report.fields.participant.age;
  //         content.patient_gender = report.fields.participant.gender;
  //       }
  //     }
  //   ],
  //   events: [
  //     {
  //       id: 'oral-immediate',
  //       days: 0,
  //       start: 0,
  //       end: 14 
  //     }
  //   ]
  // },
    {
    name: 'physician_review_from_oral_assessment',
    icon: 'icon-disease-cancer',
    title: 'Physician Oral Cancer Review',
    appliesTo: 'reports',
    appliesToType: ['oral_cancer_assessment'],
    appliesIf: function(contact, report) {
      var fields = report.fields || {};
      var analysisPage = fields.final_ai_analysis_page || {};
      var referral = analysisPage.final_ai_referral || '';
      return user.role === 'physician' && 
             !report.deleted &&
             (referral === 'refer' || referral === 'refer_anyway');
    },
    resolvedIf: function(contact, report) {
      return contact.reports.some(function(r) {
        return r.form === 'physician_oral_cancer_review' &&
               !r.deleted &&
               r.fields &&
               r.fields.source_form_uuid === report._id;
      });
    },
    actions: [
      {
        type: 'report',
        form: 'physician_oral_cancer_review',
        label: 'Review Oral Cancer Photos',
        modifyContent: function(content, contact, report) {
          var fields = report.fields || {};
          content.inputs = content.inputs || {};
          content.inputs.source_form_uuid_input = report._id;
          for (var i = 1; i <= 8; i++) {
            var page = fields['photo_' + i + '_page'] || {};
            var val = page['photo_' + i] || '';
            content.inputs['photo_' + i + '_fetched'] = val ? 'user-file-' + val : '';
          }
        }
      }
    ],
    events: [
      {
        id: 'physician-review-oc',
        days: 0,
        start: 0,
        end: 30
      }
    ]
  },

  // 5. Physician Review ← triggered by ncd (when oral section is filled)
  {
    name: 'physician_review_from_ncd',
    icon: 'icon-disease-cancer',
    title: 'Physician Oral Cancer Review',
    appliesTo: 'reports',
    appliesToType: ['ncd'],
    appliesIf: function(contact, report) {
      var fields = report.fields || {};
      var analysisPage = fields.oc_final_ai_analysis_page || {};
      var referral = analysisPage.oc_final_ai_referral || '';
      return user.role === 'physician' && 
             !report.deleted &&
             report.fields &&
             (referral === 'refer' || referral === 'refer_anyway');
    },
    resolvedIf: function(contact, report) {
      return contact.reports.some(function(r) {
        return r.form === 'physician_oral_cancer_review' &&
               !r.deleted &&
               r.fields &&
               r.fields.source_form_uuid === report._id;
      });
    },
    actions: [
      {
        type: 'report',
        form: 'physician_oral_cancer_review',
        label: 'Review Oral Cancer Photos',
        modifyContent: function(content, contact, report) {
          var fields = report.fields || {};
          content.inputs = content.inputs || {};
          content.inputs.source_form_uuid_input = report._id;

          for (var i = 1; i <= 8; i++) {
            var page = fields['oc_photo_' + i + '_page'] || {};
            var val = page['oc_photo_' + i] || '';
            content.inputs['photo_' + i + '_fetched'] = val ? 'user-file-' + val : '';
          }
        }
      }
    ],
    events: [
      {
        id: 'physician-review-ncd',
        days: 0,
        start: 0,
        end: 30
      }
    ]
  },
    {
    name: 'phq9_followup_after_physician_review',
    icon: 'icon-healthcare-generic-2',
    title: 'PHQ-9 Follow-up After Oral Cancer Review',
    appliesTo: 'reports',
    appliesToType: ['physician_oral_cancer_review'],
    appliesIf: function(contact, report) {
      return user.role === UserRole.ASHA && !report.deleted;
    },
    resolvedIf: function(contact, report) {
      // Resolved once a phq9_followup_actions form is submitted after the physician review
      return contact.reports.some(function(r) {
        return r.form === 'phq9_followup_actions' &&
               !r.deleted &&
               r.reported_date >= report.reported_date;
      });
    },
    actions: [
      {
        type: 'report',
        form: 'phq9_followup_actions',
        label: 'Complete PHQ-9 Follow-up',
        modifyContent: function(content, contact, report) {
          var fields = report.fields || {};
          // Pass physician review context into the PHQ-9 follow-up form
          content.previous_score    = fields.previous_score || '';
          content.previous_severity = fields.previous_severity || '';
        }
      }
    ],
    events: [
      {
        id: 'phq9-followup-after-physician-review',
        days: 0,    // Appears immediately after physician form is submitted
        start: 0,
        end: 14     // Stays open for 2 weeks or until resolved
      }
    ]
  },
  {
    name: 'cbac.follow_up',
    icon: 'icon-healthcare',
    title: 'task.cbac.follow_up.title',
    appliesTo: 'reports',
    appliesToType: ['cbac'],
    appliesIf: function(contact, report) {
      if (user.role !== UserRole.ASHA || getField(report, 'risk_category') !== 'High Risk' || !isAlive(contact)) {
        return false;
      }
      // Only apply to the most recent CBAC — older ones are superseded by the new submission
      const newestCbac = getNewestReport(contact.reports, ['cbac']);
      return newestCbac && newestCbac._id === report._id;
    },
    resolvedIf: function(contact, report) {
      // Resolved once any cbac_followup is submitted after this cbac report
      return contact.reports.some(function(r) {
        // Resolve if this NCD was opened from this specific CBAC task
        if (r.fields && r.fields.inputs && r.fields.inputs.cbac_source_id === report._id) { 
          return true; 
        }
        return r.form === 'cbac_followup' && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: 'cbac_followup',
      label: 'CBAC Follow-up',
      // modifyContent: function(content, contact) {
      //   content['inputs/contact/_id']        = contact.contact._id;
      //   content['inputs/contact/patient_id'] = contact.contact.patient_id;
      //   content['inputs/contact/name']       = contact.contact.name;
      //   content['inputs/contact/gender']     = contact.contact.gender;
      // },
    }],
    events: [{
      id: 'cbac-follow-up',
      // Production: days: 5, start: 5, end: 7
      // days: 5,
      // start: 5,
      days: 0,   // DEV: immediate
      start: 0,  // DEV: immediate
      end: 7,
    }],
  },


  // Task 1b: CBAC PHQ-9 Follow-up — triggered when PHQ-2 total score > 3 (Part D)
  {
    name: 'cbac.phq9_followup',
    icon: 'icon-healthcare-generic-2',
    title: 'task.cbac.phq9_followup.title',
    appliesTo: 'reports',
    appliesToType: ['cbac'],
    appliesIf: function(contact, report) {
      if (user.role !== UserRole.CHO) { return false; }
      if (!isAlive(contact)) { return false; }
      // Only trigger if PHQ-2 score is high enough to warrant follow-up
      const phq2Total = parseInt(getField(report, 'phq2_total'));
      if (phq2Total <= 3) { return false; }
      // Only apply to the most recent CBAC — older ones are superseded by the new submission
      const newestCbac = getNewestReport(contact.reports, ['cbac']);
      return newestCbac && newestCbac._id === report._id;
    },
    resolvedIf: function(contact, report) {
      // Resolve if a newer CBAC exists — the old task is superseded
      const newerCbac = getNewestReport(contact.reports, ['cbac']);
      if (newerCbac && newerCbac.reported_date > report.reported_date) { return true; }
      // Resolve once any phq9 form is submitted after this cbac report
      return contact.reports.some(function(r) {
        return r.form === 'phq9' && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: 'phq9',
      label: 'task.cbac.phq9_followup.action_label',
      modifyContent: function(content, _contact, report) {
        content.state    = getField(report, 'inputs.state');
        content.district = getField(report, 'inputs.district');
      }
    }],
    events: [{
      id: 'cbac-phq9-followup',
      days: 0,
      start: 0,
      end: 60,
    }],
  },

  // Task 1b: CBAC NCD Screening — triggered alongside CBAC follow-up for high-risk patients
  {
    name: 'cbac.ncd_screening',
    icon: 'icon-healthcare-generic-2',
    title: 'task.cbac.ncd_screening.title',
    appliesTo: 'reports',
    appliesToType: ['cbac'],
    appliesIf: function(contact, report) {
      if (user.role !== UserRole.CHO) { return false; }
      if (getField(report, 'risk_category') !== 'High Risk') { return false; }
      if (!isAlive(contact)) { return false; }
      // Only apply to the most recent CBAC — when a new CBAC is submitted the old task disappears
      const newestCbac = getNewestReport(contact.reports, ['cbac']);
      return newestCbac && newestCbac._id === report._id;
    },
    resolvedIf: function(contact, report) {
      // Resolved once any ncd form is submitted after this cbac report
      return contact.reports.some(function(r) {
        if (r.form !== 'ncd') { return false; }
        // Fallback: resolve on any NCD submitted after this CBAC
        return r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: 'ncd',
      label: 'NCD Screening',
      modifyContent: function(content, _contact, report) {
        content.state           = getField(report, 'inputs.state');
        content.district        = getField(report, 'inputs.district');
        content.cbac_source_id  = report._id;
      }
    }],
    events: [{
      id: 'cbac-ncd-screening',
      // Production: days: 5, start: 5, end: 7
      // days: 5,
      // start: 5,
      days: 0,   // DEV: immediate
      start: 0,  // DEV: immediate
      end: 7,
    }],
  },

  // Task 2: CBAC Checkup Date Follow-up — triggered when patient agreed to checkup date
  {
    name: 'cbac.checkup_date_follow_up',
    icon: 'icon-healthcare',
    title: 'task.cbac.checkup_date_follow_up.title',
    appliesTo: 'reports',
    appliesToType: ['cbac_followup'],
    appliesIf: function(contact, report) {
      if (user.role !== UserRole.ASHA) { return false; }
      if (!isAlive(contact)) { return false; }
      if (getField(report, 'ncd_followup.t_willing_for_checkup') !== 'yes') { return false; }
      if (getField(report, 'ncd_followup.t_ncd_day_visited') === 'yes') { return false; }
      // Only apply to the most recent cbac_followup — older ones are superseded
      const newestFollowup = getNewestReport(contact.reports, ['cbac_followup']);
      if (!newestFollowup || newestFollowup._id !== report._id) { return false; }
      // Count only cbac_followups submitted after the most recent CBAC — resets per CBAC cycle
      const newestCbac = getNewestReport(contact.reports, ['cbac']);
      const newestCbacDate = newestCbac ? newestCbac.reported_date : 0;
      const followupCount = contact.reports.filter(function(r) {
        return r.form === 'cbac_followup' && r.reported_date > newestCbacDate;
      }).length;
      return followupCount <= 2;
    },
    resolvedIf: function(contact, report) {
      // Resolved when any newer cbac_followup is submitted — supersedes this scheduled task
      return contact.reports.some(function(r) {
        return r.form === 'cbac_followup' && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: 'cbac_followup',
      label: 'CBAC Checkup Follow-up'
    }],
    events: [{
      id: 'cbac-checkup-date-follow-up',
      // Production: use date entered by ASHA in previous cbac_followup
      dueDate: function(event, contact, report) {
        return getDateISOLocal(getField(report, 'ncd_followup.t_checkup_date'));
      },
      // start: 1,
      start: 0,  // DEV: immediate
      end: 7,
    }],
  },


  // CBAC Task: Referral Review — shown to CHO when score > 4 or PHQ-2 > 3 (always HWC)
  {
    name: 'cbac.referral_review',
    icon: 'icon-healthcare-generic-2',
    title: 'CBAC Referral Review',
    appliesTo: 'reports',
    appliesToType: ['cbac'],
    appliesIf: function(contact, report) {
      if (user.role !== UserRole.CHO) { return false; }
      if (!isAlive(contact)) { return false; }
      const highRisk = getField(report, 'risk_category') === 'High Risk';
      const highPhq2 = parseInt(getField(report, 'phq2_total')) > 3;
      return highRisk || highPhq2;
    },
    resolvedIf: function(contact, report) {
      return contact.reports.some(function(r) {
        return r.form === 'cbac_referral_review' &&
               r.fields && r.fields.inputs && r.fields.inputs.source_cbac_id === report._id;
      });
    },
    actions: [{
      type: 'report',
      form: 'cbac_referral_review',
      label: 'Review CBAC Referral',
      modifyContent: function(content, _contact, report) {
        const highRisk = getField(report, 'risk_category') === 'High Risk';
        const highPhq2 = parseInt(getField(report, 'phq2_total')) > 3;
        const reasons = [];
        if (highRisk) { reasons.push('High CBAC Risk Score (' + getField(report, 'total_score') + ')'); }
        if (highPhq2) { reasons.push('High PHQ-2 Score (' + getField(report, 'phq2_total') + ')'); }
        content.t_asha_name      = getField(report, 'reporter_name');
        content.t_total_score    = getField(report, 'total_score');
        content.t_risk_category  = getField(report, 'risk_category');
        content.t_phq2_total     = getField(report, 'phq2_total') || '0';
        content.t_referral_reason = reasons.join(', ');
        content.source_cbac_id   = report._id;
      }
    }],
    events: [{
      id: 'cbac-referral-review',
      days: 0,
      start: 0,
      end: 30,
    }],
  },

  // NCD Task: BP Referral Review — shown to Physician (PHC) or Medical Officer (CHC)
  {
    name: 'ncd.bp_referral_review',
    icon: 'icon-healthcare-generic-2',
    title: 'NCD BP Referral Review',
    appliesTo: 'reports',
    appliesToType: ['ncd'],
    appliesIf: function(contact, report) {
      const facility =
        getField(report, 'f2_bp_referral_facility_page.f2_bp_referral_facility') ||
        getField(report, 'f2_bp_normal_referral_facility_page.f2_bp_normal_referral_facility');
      if (!facility || facility === 'dh') { return false; }
      if (facility === 'phc') { return user.role === UserRole.PHYSICIAN && isAlive(contact); }
      if (facility === 'chc') { return user.role === UserRole.MEDICAL_OFFICER && isAlive(contact); }
      return false;
    },
    resolvedIf: function(contact, report) {
      return contact.reports.some(function(r) {
        return r.form === 'ncd_bp_referral_review' &&
               r.fields && r.fields.inputs && r.fields.inputs.source_ncd_id === report._id;
      });
    },
    actions: [{
      type: 'report',
      form: 'ncd_bp_referral_review',
      label: 'Review BP Referral',
      modifyContent: function(content, _contact, report) {
        content.t_cho_name         = getField(report, 'reporter_name');
        content.t_referral_facility =
          getField(report, 'f2_bp_referral_facility_page.f2_bp_referral_facility') ||
          getField(report, 'f2_bp_normal_referral_facility_page.f2_bp_normal_referral_facility') || '';
        content.t_bp_systolic      = getField(report, 'f2_hypertension.f2_systolic');
        content.t_bp_diastolic     = getField(report, 'f2_hypertension.f2_diastolic');
        content.t_glucose          = getField(report, 'f2_diabetes_section.f2_rapid_glucose');
        content.source_ncd_id      = report._id;
      }
    }],
    events: [{
      id: 'ncd-bp-referral-review',
      days: 0,
      start: 0,
      end: 30,
    }],
  },

  // NCD Task: Glucose Referral Review — shown to Physician (PHC) or Medical Officer (CHC)
  {
    name: 'ncd.glucose_referral_review',
    icon: 'icon-healthcare-generic-2',
    title: 'NCD Glucose Referral Review',
    appliesTo: 'reports',
    appliesToType: ['ncd'],
    appliesIf: function(contact, report) {
      const facility =
        getField(report, 'f2_glucose_referral_facility_page.f2_glucose_referral_facility') ||
        getField(report, 'f2_glucose_normal_referral_facility_page.f2_glucose_normal_referral_facility');
      if (!facility || facility === 'dh') { return false; }
      if (facility === 'phc') { return user.role === UserRole.PHYSICIAN && isAlive(contact); }
      if (facility === 'chc') { return user.role === UserRole.MEDICAL_OFFICER && isAlive(contact); }
      return false;
    },
    resolvedIf: function(contact, report) {
      return contact.reports.some(function(r) {
        return r.form === 'ncd_glucose_referral_review' &&
               r.fields && r.fields.inputs && r.fields.inputs.source_ncd_id === report._id;
      });
    },
    actions: [{
      type: 'report',
      form: 'ncd_glucose_referral_review',
      label: 'Review Glucose Referral',
      modifyContent: function(content, _contact, report) {
        content.t_cho_name          = getField(report, 'reporter_name');
        content.t_referral_facility =
          getField(report, 'f2_glucose_referral_facility_page.f2_glucose_referral_facility') ||
          getField(report, 'f2_glucose_normal_referral_facility_page.f2_glucose_normal_referral_facility') || '';
        content.t_bp_systolic       = getField(report, 'f2_hypertension.f2_systolic');
        content.t_bp_diastolic      = getField(report, 'f2_hypertension.f2_diastolic');
        content.t_glucose           = getField(report, 'f2_diabetes_section.f2_rapid_glucose');
        content.source_ncd_id       = report._id;
      }
    }],
    events: [{
      id: 'ncd-glucose-referral-review',
      days: 0,
      start: 0,
      end: 30,
    }],
  },

  // NCD Task 1: Hypertension Follow-up — moderate (systolic > 120 AND diastolic > 80)
  // Severe cases (systolic > 140 OR diastolic > 90) are handled by ncd.hypertension_referral below
  {
    name: 'ncd.hypertension_followup',
    icon: 'icon-healthcare-generic-2',
    title: 'task.ncd.hypertension_followup.title',
    appliesTo: 'reports',
    appliesToType: ['ncd'],
    appliesIf: function(contact, report) {
      const userRole = user.role;
      const systolic = parseInt(getField(report, 'f2_hypertension.f2_systolic'));
      const diastolic = parseInt(getField(report, 'f2_hypertension.f2_diastolic'));
      // Moderate: both elevated, but NOT in severe range (severe task takes priority)
      const isModerate = systolic > 120 && diastolic > 80;
      const isSevere = systolic > 140 || diastolic > 90;
      return userRole === UserRole.ASHA && isModerate && !isSevere && isAlive(contact);
    },
    resolvedIf: function(contact, report) {
      // Resolve if a newer NCD report exists — re-assessment supersedes this task
      const newerNcd = getNewestReport(contact.reports, ['ncd']);
      if (newerNcd && newerNcd.reported_date > report.reported_date) { return true; }
      // Resolve once any hypertension follow-up form is submitted after this ncd report
      return contact.reports.some(function(r) {
        return r.form === 'ncd_hypertension_followup' && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: 'ncd_hypertension_followup',
      label: 'Hypertension Follow-up',
      modifyContent: function(content, _contact, report) {
        content.t_systolic = getField(report, 'f2_hypertension.f2_systolic');
        content.t_diastolic = getField(report, 'f2_hypertension.f2_diastolic');
      }
    }],
    events: [{
      id: 'ncd-hypertension-followup',
      // Production: days: 30, start: 5, end: 7
      // days: 30,
      // start: 5,
      days: 0,  // DEV: immediate
      start: 0, // DEV: immediate
      end: 7,
    }],
  },

  // NCD Task 2: Hypertension Referral — severe (systolic > 140 OR diastolic > 90)
  {
    name: 'ncd.hypertension_referral',
    icon: 'icon-healthcare-generic-2',
    title: 'task.ncd.hypertension_referral.title',
    appliesTo: 'reports',
    appliesToType: ['ncd'],
    appliesIf: function(contact, report) {
      const userRole = user.role;
      const isReferred = getField(report, 'f2_bp_referral_page.f2_bp_referral_decision') === 'refer_anyway' || getField(report, 'f2_bp_normal_page.f2_bp_referral_decision_normal') === 'refer_anyway';
      return userRole === UserRole.ASHA && isReferred && isAlive(contact);
    },
    resolvedIf: function(contact, report) {
      // Resolve if a newer NCD report exists (re-assessment happened)
      const newerNcd = getNewestReport(contact.reports, ['ncd']);
      if (newerNcd && newerNcd.reported_date > report.reported_date) { return true; }

      // Resolve once any ncd_hypertension_referral form is submitted after this report
      // — regardless of outcome (visited, refused, or agreed to future date)
      return contact.reports.some(function(r) {
        return r.form === 'ncd_hypertension_referral' && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: 'ncd_hypertension_referral',
      label: 'Hypertension Referral Follow-up',
      modifyContent: function(content, _contact, report) {
        content.t_systolic = getField(report, 'f2_hypertension.f2_systolic');
        content.t_diastolic = getField(report, 'f2_hypertension.f2_diastolic');
        // Pass selected referral facility — high-risk path takes priority over normal "Refer Anyway"
        content.t_referral_facility =
          getField(report, 'f2_bp_referral_facility_page.f2_bp_referral_facility') ||
          getField(report, 'f2_bp_normal_referral_facility_page.f2_bp_normal_referral_facility') ||
          'phc';
      }
    }],
    events: [{
      id: 'ncd-hypertension-referral',
      // Production: days: 5, start: 3, end: 7
      // days: 5,
      // start: 3,
      days: 0,  // DEV: immediate
      start: 0, // DEV: immediate
      end: 7,
    }],
  },

  // NCD Task 2b: Hypertension Referral Follow-up — when patient agreed to a PHC visit date
  {
    name: 'ncd.hypertension_referral_scheduled',
    icon: 'icon-healthcare-generic-2',
    title: 'task.ncd.hypertension_referral_scheduled.title',
    appliesTo: 'reports',
    appliesToType: ['ncd_hypertension_referral'],
    appliesIf: function(contact, report) {
      // Only trigger on reports where the patient agreed but hasn't visited yet
      // t_phc_visited being set means this is a completed follow-up, not an initial referral
      return user.role === UserRole.ASHA &&
             getField(report, 'referral.t_willing_to_visit') === 'yes' &&
             getField(report, 'referral.t_phc_visit_date') &&
             getField(report, 'referral.t_phc_visited') !== 'yes' &&
             isAlive(contact);
    },
    resolvedIf: function(contact, report) {
      // Resolved when any newer ncd_hypertension_referral is submitted — the scheduled
      // task is superseded by the follow-up regardless of its outcome
      return contact.reports.some(function(r) {
        return r.form === 'ncd_hypertension_referral' && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: 'ncd_hypertension_referral',
      label: 'Hypertension Referral Follow-up',
      modifyContent: function(content, _contact, report) {
        content.t_systolic          = getField(report, 'inputs.t_systolic');
        content.t_diastolic         = getField(report, 'inputs.t_diastolic');
        content.t_referral_facility = getField(report, 'inputs.t_referral_facility') || 'phc';
      }
    }],
    events: [{
      id: 'ncd-hypertension-referral-scheduled',
      start: 3,
      end: 7,
      dueDate: function(_event, _contact, report) {
        return getDateISOLocal(getField(report, 'referral.t_phc_visit_date'));
      }
    }],
  },

  // NCD Task 3: Diabetes Referral — rapid glucose > 140 mg/dL
  {
    name: 'ncd.diabetes_referral',
    icon: 'icon-healthcare-generic-2',
    title: 'task.ncd.diabetes_referral.title',
    appliesTo: 'reports',
    appliesToType: ['ncd'],
    appliesIf: function(contact, report) {
      const userRole = user.role;

      const isReferred = getField(report, 'f2_glucose_referral_page.f2_glucose_referral_decision') === 'refer_anyway' || getField(report, 'f2_glucose_normal_page.f2_glucose_referral_decision_normal') === 'refer_anyway';

      return userRole === UserRole.ASHA && isReferred && isAlive(contact);
    },
    resolvedIf: function(contact, report) {
      // Resolve if a newer NCD report exists (re-assessment happened)
      const newerNcd = getNewestReport(contact.reports, ['ncd']);
      if (newerNcd && newerNcd.reported_date > report.reported_date) { return true; }

      // Resolve once any ncd_diabetes_referral form is submitted after this report
      // — regardless of outcome (visited, refused, or agreed to future date)
      return contact.reports.some(function(r) {
        return r.form === 'ncd_diabetes_referral' && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: 'ncd_diabetes_referral',
      label: 'Diabetes Referral Follow-up',
      modifyContent: function(content, _contact, report) {
        content.t_rapid_glucose = getField(report, 'f2_diabetes_section.f2_rapid_glucose');
        // Pass selected referral facility — high-risk path takes priority over normal "Refer Anyway"
        content.t_referral_facility =
          getField(report, 'f2_glucose_referral_facility_page.f2_glucose_referral_facility') ||
          getField(report, 'f2_glucose_normal_referral_facility_page.f2_glucose_normal_referral_facility') ||
          'phc';
      }
    }],
    events: [{
      id: 'ncd-diabetes-referral',
      // Production: days: 5, start: 3, end: 7
      // days: 5,
      // start: 3,
      days: 0,  // DEV: immediate
      start: 0, // DEV: immediate
      end: 7,
    }],
  },

  // NCD Task 3b: Diabetes Referral Follow-up — when patient agreed to a PHC visit date
  {
    name: 'ncd.diabetes_referral_scheduled',
    icon: 'icon-healthcare-generic-2',
    title: 'task.ncd.diabetes_referral_scheduled.title',
    appliesTo: 'reports',
    appliesToType: ['ncd_diabetes_referral'],
    appliesIf: function(contact, report) {
      // Only trigger on reports where the patient agreed but hasn't visited yet
      // t_phc_visited being set means this is a completed follow-up, not an initial referral
      return user.role === UserRole.ASHA &&
             getField(report, 'referral.t_willing_to_visit') === 'yes' &&
             getField(report, 'referral.t_phc_visit_date') &&
             getField(report, 'referral.t_phc_visited') !== 'yes' &&
             isAlive(contact);
    },
    resolvedIf: function(contact, report) {
      // Resolved when any newer ncd_diabetes_referral is submitted — the scheduled
      // task is superseded by the follow-up regardless of its outcome
      return contact.reports.some(function(r) {
        return r.form === 'ncd_diabetes_referral' && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: 'ncd_diabetes_referral',
      label: 'Diabetes Referral Follow-up',
      modifyContent: function(content, _contact, report) {
        content.t_rapid_glucose     = getField(report, 'inputs.t_rapid_glucose');
        content.t_referral_facility = getField(report, 'inputs.t_referral_facility') || 'phc';
      }
    }],
    events: [{
      id: 'ncd-diabetes-referral-scheduled',
      start: 3,
      end: 7,
      dueDate: function(_event, _contact, report) {
        return getDateISOLocal(getField(report, 'referral.t_phc_visit_date'));
      }
    }],
  },
  // {
  //   name: 'physician_oral_cancer_review',
  //   icon: 'icon-disease-cancer',
  //   title: 'Physician Oral Cancer Photo Review',
  //   appliesTo: 'reports',
  //   appliesToType: ['oral_cancer_assessment', 'ncd'],
  //   appliesIf: function(contact, report) {
  //     // Trigger for standalone oral cancer assessment
  //     if (report.form === 'oral_cancer_assessment') {
  //       return true;
  //     }
  //     // Trigger for NCD form only when Form 4 (oral section) was filled
  //     if (report.form === 'ncd') {
  //       return report.fields.fill_oral_cancer_form === 'yes';
  //     }
  //     return false;
  //   },
  //   resolvedIf: function(contact, report) {
  //     return contact.reports.some(function(r) {
  //       return r.form === 'physician_oral_cancer_review' &&
  //             r.reported_date >= report.reported_date;
  //     });
  //   },
  //   actions: [
  //     {
  //       type: 'report',
  //       form: 'physician_oral_cancer_review',
  //       modifyContent: function(content, contact, report) {
  //         content.patient_id   = contact.patient_id;
  //         content.patient_uuid = contact._id;
  //         content.patient_name = contact.name;

  //         content.source_form_id   = report.form;
  //         content.source_form_uuid = report._id;  // used to build the img URL

  //         // Pass the attachment field name for each photo.
  //         // CHT stores image fields as the filename of the attachment.
  //         // The note renders: /api/v1/documents/{source_form_uuid}/{photo_N_fetched}
  //         var prefix = report.form === 'ncd' ? 'oc_' : '';
  //         for (var i = 1; i <= 8; i++) {
  //           var fieldName = prefix + 'photo_' + i;
  //           // report.fields stores the attachment filename string for image fields
  //           content['photo_' + i + '_fetched'] = report.fields[fieldName] || '';
  //         }
  //       }
  //     }
  //   ],
  //   events: [
  //     {
  //       id: 'physician-review-immediate',
  //       days: 0,
  //       start: 0,
  //       end: 30
  //     }
  //   ]
  // }


];





//Hello

