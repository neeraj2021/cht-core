const extras = require('./nools-extras');

const {
  MAX_DAYS_IN_PREGNANCY,
  today,
  getNewestPregnancyTimestamp,
  getNewestDeliveryTimestamp,
  isAlive,
  isFormArraySubmittedInWindow,
  getDateISOLocal,
  getTimeForMidnight,
  isDeliveryForm,
  getMostRecentLMPDateForPregnancy,
  addDays,
  getRecentANCVisitWithEvent,
  isPregnancyTaskMuted,
  getField,
  getNewestReport
} = extras;

const generateEventForHomeVisit = (week, start, end) => ({
  id: `pregnancy-home-visit-week${week}`,
  start,
  end,
  dueDate: function (event, contact, report) {
    const recentLMPDate = getMostRecentLMPDateForPregnancy(contact, report);
    if (recentLMPDate) { return addDays(recentLMPDate, week * 7); }
    return addDays(report.reported_date, week * 7);
  }
});

function checkTaskResolvedForHomeVisit(contact, report, event, dueDate) {
  //delivery form submitted
  if (report.reported_date < getNewestDeliveryTimestamp(contact)) { return true; }

  //old pregnancy report
  if (report.reported_date < getNewestPregnancyTimestamp(contact)) { return true; }

  //miscarriage or abortion
  if (getRecentANCVisitWithEvent(contact, report, 'abortion') || getRecentANCVisitWithEvent(contact, report, 'miscarriage')) { return true; }

  //Due date older than reported day
  if (dueDate <= getTimeForMidnight(report.reported_date)) { return true; }

  //Tasks cleared
  if (isPregnancyTaskMuted(contact)) { return true; }
  const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date);
  const endTime = addDays(dueDate, event.end + 1).getTime();
  return isFormArraySubmittedInWindow(contact.reports, ['pregnancy_home_visit'], startTime, endTime);
}

module.exports = [

  //ANC Home Visit: 12, 20, 26, 30, 34, 36, 38, 40 weeks (Known LMP)
  {
    name: 'anc.pregnancy_home_visit.known_lmp',
    icon: 'icon-pregnancy',
    title: 'task.anc.pregnancy_home_visit.title',
    appliesTo: 'reports',
    appliesToType: ['pregnancy'],
    appliesIf: function (contact, report) {
      // If LMP date is known
      return !!getMostRecentLMPDateForPregnancy(contact, report);
    },

    resolvedIf: checkTaskResolvedForHomeVisit,

    actions: [
      {
        type: 'report',
        form: 'pregnancy_home_visit',
        label: 'Pregnancy home visit'
      }
    ],
    events: [
      generateEventForHomeVisit(12, 7, 14),
      generateEventForHomeVisit(20, 7, 14),
      generateEventForHomeVisit(26, 7, 14),
      generateEventForHomeVisit(30, 7, 14),
      generateEventForHomeVisit(34, 6, 7),
      generateEventForHomeVisit(36, 6, 7),
      generateEventForHomeVisit(38, 6, 7),
      generateEventForHomeVisit(40, 6, 7)
    ]
  },

  //ANC Home Visit: show every 2 weeks (Unknown LMP)
  {
    name: 'anc.pregnancy_home_visit.unknown_lmp',
    icon: 'icon-pregnancy',
    title: 'task.anc.pregnancy_home_visit.title',
    appliesTo: 'reports',
    appliesToType: ['pregnancy'],
    appliesIf: function (contact, report) {// If LMP date is unknown
      const recentLMP = getMostRecentLMPDateForPregnancy(contact, report);
      //We only want to show until 42 weeks + 7 days
      return !recentLMP && addDays(report.reported_date, MAX_DAYS_IN_PREGNANCY + 7) >= today;
    },

    resolvedIf: checkTaskResolvedForHomeVisit,

    actions: [
      {
        type: 'report',
        form: 'pregnancy_home_visit',
        label: 'Pregnancy home visit'
      }
    ],
    //every two weeks from reported date until 42nd week, show before due date: 6 days, show after due date: 7 days
    events: [...Array(21).keys()].map(i => generateEventForHomeVisit((i + 1) * 2, 6, 7))
  },

  //ANC - Health Facility Visit Reminder
  {
    name: 'anc.facility_reminder',
    icon: 'icon-pregnancy',
    title: 'task.anc.facility_reminder.title',
    appliesTo: 'reports',
    appliesToType: ['pregnancy', 'pregnancy_home_visit'],
    appliesIf: function (contact, report) {
      //next pregnancy visit date is entered
      return getField(report, 't_pregnancy_follow_up_date');
    },

    resolvedIf: function (contact, report, event, dueDate) {
      //(refused or migrated) and cleared tasks 
      if (isPregnancyTaskMuted(contact)) { return true; }
      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date);
      const endTime = addDays(dueDate, event.end + 1).getTime();
      return isFormArraySubmittedInWindow(contact.reports, ['pregnancy_facility_visit_reminder'], startTime, endTime);

    },
    actions: [{
      type: 'report',
      form: 'pregnancy_facility_visit_reminder',
      label: 'Pregnancy facility visit reminder',
      modifyContent: function (content, contact, report) {
        content.source_visit_date = getField(report, 't_pregnancy_follow_up_date');
      }
    }],
    events: [{
      id: 'pregnancy-facility-visit-reminder',
      start: 3,
      end: 7,
      dueDate: function (event, contact, report) {
        //next visit date
        return getDateISOLocal(getField(report, 't_pregnancy_follow_up_date'));
      }
    }
    ]
  },

  {
    name: 'anc.pregnancy_danger_sign_followup',
    icon: 'icon-pregnancy-danger',
    title: 'task.anc.pregnancy_danger_sign_followup.title',
    appliesTo: 'reports',
    appliesToType: ['pregnancy', 'pregnancy_home_visit', 'pregnancy_danger_sign', 'pregnancy_danger_sign_follow_up'],
    appliesIf: function (contact, report) {
      return getField(report, 't_danger_signs_referral_follow_up') === 'yes' && isAlive(contact);
    },
    resolvedIf: function (contact, report, event, dueDate) {
      //(refused or migrated) and cleared tasks 
      if (isPregnancyTaskMuted(contact)) { return true; }
      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date + 1);
      const endTime = addDays(dueDate, event.end + 1).getTime();
      return isFormArraySubmittedInWindow(contact.reports, ['pregnancy_danger_sign_follow_up'], startTime, endTime);
    },
    actions: [
      {
        type: 'report',
        form: 'pregnancy_danger_sign_follow_up'
      }
    ],
    events: [
      {
        id: 'pregnancy-danger-sign-follow-up',
        start: 3,
        end: 7,
        dueDate: function (event, contact, report) {
          return getDateISOLocal(getField(report, 't_danger_signs_referral_follow_up_date'));
        }
      }
    ]
  },

  {
    name: 'anc.delivery',
    icon: 'icon-mother-child',
    title: 'task.anc.delivery.title',
    appliesTo: 'reports',
    appliesToType: ['pregnancy'],
    appliesIf: function (contact, report) {
      const lmpDate = getMostRecentLMPDateForPregnancy(contact, report);
      //only for known LMP, show for maximum of 42 + 6 weeks
      return lmpDate && addDays(lmpDate, 336) >= today && isAlive(contact);
    },
    resolvedIf: function (contact, report, event, dueDate) {
      //miscarriage or abortion
      if (getRecentANCVisitWithEvent(contact, report, 'abortion') || getRecentANCVisitWithEvent(contact, report, 'miscarriage')) { return true; }

      //(refused or migrated) and cleared tasks 
      if (isPregnancyTaskMuted(contact)) { return true; }
      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date);
      const endTime = addDays(dueDate, event.end + 1).getTime();
      return isFormArraySubmittedInWindow(contact.reports, ['delivery'], startTime, endTime);
    },
    actions: [
      {
        type: 'report',
        form: 'delivery'
      }
    ],
    events: [
      {
        id: 'delivery-reminder',
        start: 4 * 7,
        end: 6 * 7,
        dueDate: function (event, contact, report) {
          return addDays(getMostRecentLMPDateForPregnancy(contact, report), MAX_DAYS_IN_PREGNANCY); //LMP + 42 weeks
        }
      }
    ]
  },

  {
    name: 'pnc.danger_sign_followup_mother',
    icon: 'icon-follow-up',
    title: 'task.pnc.danger_sign_followup_mother.title',
    appliesTo: 'reports',
    appliesToType: ['delivery', 'pnc_danger_sign_follow_up_mother'],
    appliesIf: function (contact, report) {
      return getField(report, 't_danger_signs_referral_follow_up') === 'yes' && isAlive(contact);
    },
    resolvedIf: function (contact, report, event, dueDate) {
      //(refused or migrated) and cleared tasks 
      if (isPregnancyTaskMuted(contact)) { return true; }
      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date + 1);//+1 so that source ds_follow_up does not resolve itself;
      const endTime = addDays(dueDate, event.end + 1).getTime();
      return isFormArraySubmittedInWindow(contact.reports, ['pnc_danger_sign_follow_up_mother'], startTime, endTime);
    },
    actions: [
      {
        type: 'report',
        form: 'pnc_danger_sign_follow_up_mother',
        modifyContent: function (content, contact, report) {
          if (isDeliveryForm(report)) {
            content.delivery_uuid = report._id;
          }
          else {
            content.delivery_uuid = getField(report, 'inputs.delivery_uuid');
          }
        }
      }
    ],
    events: [
      {
        id: 'pnc-danger-sign-follow-up-mother',
        start: 3,
        end: 7,
        dueDate: function (event, contact, report) {
          return getDateISOLocal(getField(report, 't_danger_signs_referral_follow_up_date'));
        }
      }
    ]
  },

  {
    name: 'pnc.danger_sign_followup_baby.from_contact',
    icon: 'icon-follow-up',
    title: 'task.pnc.danger_sign_followup_baby.title',
    appliesTo: 'contacts',
    appliesToType: ['person'],
    appliesIf: function (contact) {
      return contact.contact &&
        contact.contact.t_danger_signs_referral_follow_up === 'yes' &&
        isAlive(contact);
    },
    resolvedIf: function (contact, report, event, dueDate) {
      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), contact.contact.reported_date);
      const endTime = addDays(dueDate, event.end).getTime();
      return isFormArraySubmittedInWindow(contact.reports, ['pnc_danger_sign_follow_up_baby'], startTime, endTime);
    },
    actions: [
      {
        type: 'report',
        form: 'pnc_danger_sign_follow_up_baby',
        modifyContent: function (content, contact) {
          content.delivery_uuid = contact.contact.created_by_doc;
        }
      }
    ],
    events: [
      {
        id: 'pnc-danger-sign-follow-up-baby',
        start: 3,
        end: 7,
        dueDate: function (event, contact) {
          return getDateISOLocal(contact.contact.t_danger_signs_referral_follow_up_date);
        }
      }
    ]
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
      const systolic = parseInt(getField(report, 'hypertension.systolic'));
      const diastolic = parseInt(getField(report, 'hypertension.diastolic'));
      // Moderate: both elevated, but NOT in severe range (severe task takes priority)
      const isModerate = systolic > 120 && diastolic > 80;
      const isSevere = systolic > 140 || diastolic > 90;
      return isModerate && !isSevere && isAlive(contact);
    },
    resolvedIf: function(contact, report, event, dueDate) {
      // Resolve if a newer NCD report exists for this patient (re-assessment happened)
      const newerNcd = getNewestReport(contact.reports, ['ncd']);
      if (newerNcd && newerNcd.reported_date > report.reported_date) { return true; }

      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date + 1);
      const endTime = addDays(dueDate, event.end + 1).getTime();
      return isFormArraySubmittedInWindow(contact.reports, ['ncd_hypertension_followup'], startTime, endTime);
    },
    actions: [{
      type: 'report',
      form: 'ncd_hypertension_followup',
      label: 'Hypertension Follow-up',
      modifyContent: function(content, _contact, report) {
        content.t_systolic = getField(report, 'hypertension.systolic');
        content.t_diastolic = getField(report, 'hypertension.diastolic');
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
      const systolic = parseInt(getField(report, 'hypertension.systolic'));
      const diastolic = parseInt(getField(report, 'hypertension.diastolic'));
      const isSevere = systolic > 140 || diastolic > 90;
      const isReferred = getField(report, 'bp_referral_page.bp_referral_decision') === 'refer_anyway';
      return isSevere && isReferred && isAlive(contact);
    },
    resolvedIf: function(contact, report, event, dueDate) {
      // Resolve if a newer NCD report exists for this patient (re-assessment happened)
      const newerNcd = getNewestReport(contact.reports, ['ncd']);
      if (newerNcd && newerNcd.reported_date > report.reported_date) { return true; }

      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date + 1);
      const endTime = addDays(dueDate, event.end + 1).getTime();
      // Resolve if referral form submitted and patient visited PHC or not willing
      const referralDone = contact.reports.some(function(r) {
        if (r.form !== 'ncd_hypertension_referral') { return false; }
        if (r.reported_date < startTime || r.reported_date > endTime) { return false; }
        const visited = getField(r, 'referral.t_phc_visited');
        const willing = getField(r, 'referral.t_willing_to_visit');
        return visited === 'yes' || willing === 'no';
      });
      return referralDone;
    },
    actions: [{
      type: 'report',
      form: 'ncd_hypertension_referral',
      label: 'Hypertension Referral Follow-up',
      modifyContent: function(content, _contact, report) {
        content.t_systolic = getField(report, 'hypertension.systolic');
        content.t_diastolic = getField(report, 'hypertension.diastolic');
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
      return getField(report, 'referral.t_willing_to_visit') === 'yes' &&
             getField(report, 'referral.t_phc_visit_date') &&
             isAlive(contact);
    },
    resolvedIf: function(contact, report, event, dueDate) {
      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date + 1);
      const endTime = addDays(dueDate, event.end + 1).getTime();
      const referralDone = contact.reports.some(function(r) {
        if (r.form !== 'ncd_hypertension_referral') { return false; }
        if (r.reported_date < startTime || r.reported_date > endTime) { return false; }
        const visited = getField(r, 'referral.t_phc_visited');
        const willing = getField(r, 'referral.t_willing_to_visit');
        return visited === 'yes' || willing === 'no';
      });
      return referralDone;
    },
    actions: [{
      type: 'report',
      form: 'ncd_hypertension_referral',
      label: 'Hypertension Referral Follow-up',
      modifyContent: function(content, _contact, report) {
        content.t_systolic = getField(report, 'inputs.t_systolic');
        content.t_diastolic = getField(report, 'inputs.t_diastolic');
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
      const glucose = parseInt(getField(report, 'diabetes_section.rapid_glucose'));
      const isHighGlucose = glucose > 140;
      const isReferred = getField(report, 'glucose_referral_page.glucose_referral_decision') === 'refer_anyway';
      return isHighGlucose && isReferred && isAlive(contact);
    },
    resolvedIf: function(contact, report, event, dueDate) {
      // Resolve if a newer NCD report exists for this patient (re-assessment happened)
      const newerNcd = getNewestReport(contact.reports, ['ncd']);
      if (newerNcd && newerNcd.reported_date > report.reported_date) { return true; }

      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date + 1);
      const endTime = addDays(dueDate, event.end + 1).getTime();
      const referralDone = contact.reports.some(function(r) {
        if (r.form !== 'ncd_diabetes_referral') { return false; }
        if (r.reported_date < startTime || r.reported_date > endTime) { return false; }
        const visited = getField(r, 'referral.t_phc_visited');
        const willing = getField(r, 'referral.t_willing_to_visit');
        return visited === 'yes' || willing === 'no';
      });
      return referralDone;
    },
    actions: [{
      type: 'report',
      form: 'ncd_diabetes_referral',
      label: 'Diabetes Referral Follow-up',
      modifyContent: function(content, _contact, report) {
        content.t_rapid_glucose = getField(report, 'diabetes_section.rapid_glucose');
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
      return getField(report, 'referral.t_willing_to_visit') === 'yes' &&
             getField(report, 'referral.t_phc_visit_date') &&
             isAlive(contact);
    },
    resolvedIf: function(contact, report, event, dueDate) {
      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date + 1);
      const endTime = addDays(dueDate, event.end + 1).getTime();
      const referralDone = contact.reports.some(function(r) {
        if (r.form !== 'ncd_diabetes_referral') { return false; }
        if (r.reported_date < startTime || r.reported_date > endTime) { return false; }
        const visited = getField(r, 'referral.t_phc_visited');
        const willing = getField(r, 'referral.t_willing_to_visit');
        return visited === 'yes' || willing === 'no';
      });
      return referralDone;
    },
    actions: [{
      type: 'report',
      form: 'ncd_diabetes_referral',
      label: 'Diabetes Referral Follow-up',
      modifyContent: function(content, _contact, report) {
        content.t_rapid_glucose = getField(report, 'inputs.t_rapid_glucose');
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

  // Task 1: CBAC Follow-up — triggered after high-risk CBAC submission
  {
    name: 'cbac.follow_up',
    icon: 'icon-healthcare',
    title: 'task.cbac.follow_up.title',
    appliesTo: 'reports',
    appliesToType: ['cbac'],
    appliesIf: function(contact, report) {
      return getField(report, 'risk_category') === 'High Risk' && isAlive(contact);
    },
    resolvedIf: function(contact, report, event, dueDate) {
      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date + 1);
      const endTime = addDays(dueDate, event.end + 1).getTime();
      return isFormArraySubmittedInWindow(contact.reports, ['cbac_followup'], startTime, endTime);
    },
    actions: [{
      type: 'report',
      form: 'cbac_followup',
      label: 'CBAC Follow-up',
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

  // Task 2: CBAC Checkup Date Follow-up — triggered when patient agreed to checkup date
  {
    name: 'cbac.checkup_date_follow_up',
    icon: 'icon-healthcare',
    title: 'task.cbac.checkup_date_follow_up.title',
    appliesTo: 'reports',
    appliesToType: ['cbac_followup'],
    appliesIf: function(contact, report) {
      return getField(report, 't_willing_for_checkup') === 'yes' && isAlive(contact);
    },
    resolvedIf: function(contact, report, event, dueDate) {
      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date + 1);
      const endTime = addDays(dueDate, event.end + 1).getTime();
      return isFormArraySubmittedInWindow(contact.reports, ['cbac_followup'], startTime, endTime);
    },
    actions: [{
      type: 'report',
      form: 'cbac_followup',
      label: 'CBAC Checkup Follow-up',
    }],
    events: [{
      id: 'cbac-checkup-date-follow-up',
      // Production: use date entered by CHW in previous cbac_followup
      // dueDate: function(event, contact, report) {
      //   return getDateISOLocal(getField(report, 't_checkup_date'));
      // },
      // start: 1,
      days: 0,   // DEV: immediate
      start: 0,  // DEV: immediate
      end: 7,
    }],
  },

  {
    name: 'pnc.danger_sign_followup_baby.from_report',
    icon: 'icon-follow-up',
    title: 'task.pnc.danger_sign_followup_baby.title',
    appliesTo: 'reports',
    appliesToType: ['pnc_danger_sign_follow_up_baby'],
    appliesIf: function (contact, report) {
      return getField(report, 't_danger_signs_referral_follow_up') === 'yes' && isAlive(contact);
    },
    resolvedIf: function (contact, report, event, dueDate) {
      //(refused or migrated) and cleared tasks 
      if (isPregnancyTaskMuted(contact)) { return true; }
      const startTime = Math.max(addDays(dueDate, -event.start).getTime(), report.reported_date + 1);
      //reported_date + 1 so that source ds_follow_up does not resolve itself
      const endTime = addDays(dueDate, event.end + 1).getTime();
      return isFormArraySubmittedInWindow(contact.reports, ['pnc_danger_sign_follow_up_baby'], startTime, endTime);
    },
    actions: [
      {
        type: 'report',
        form: 'pnc_danger_sign_follow_up_baby',
        modifyContent: function (content, contact, report) {
          content.delivery_uuid = getField(report, 'inputs.delivery_uuid');
        }
      }
    ],
    events: [
      {
        id: 'pnc-danger-sign-follow-up-baby',
        start: 3,
        end: 7,
        dueDate: function (event, contact, report) {
          return getDateISOLocal(getField(report, 't_danger_signs_referral_follow_up_date'));
        }
      }
    ]
  }
];

