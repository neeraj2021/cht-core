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

const AppForms = Object.freeze({
  ORAL_CANCER_ASSESSMENT: 'oral_cancer_assessment',
  PHYSICIAN_ORAL_CANCER_REVIEW: 'physician_oral_cancer_review',
  NCD: 'ncd',
  CBAC: 'cbac',
  PHQ9: 'phq9',
  PHQ9_FOLLOWUP: 'phq9_followup',
  PHQ9_FOLLOWUP_ACTIONS: 'phq9_followup_actions',
  PHQ9_REFERRAL_REVIEW: 'phq9_referral_review',
  BC_RISK_ASSESSMENT: 'breast_cancer_risk_assessment',
  BC_REFERRAL_REVIEW: 'bc_referral_review',
  CBAC_FOLLOWUP: 'cbac_followup',
  CBAC_REFERRAL_REVIEW_HIGH_RISK: 'cbac_referral_review_high_risk',
  CBAC_REFERRAL_REVIEW_PHQ2: 'cbac_referral_review_phq2',
  NCD_DIABETES_REFERRAL: 'ncd_diabetes_referral',
  NCD_HYPERTENSION_FOLLOWUP: 'ncd_hypertension_followup',
  NCD_HYPERTENSION_REFERRAL: 'ncd_hypertension_referral',
  NCD_HYPERTENSION_REFERRAL_REVIEW: 'ncd_bp_referral_review',
  NCD_GLUCOSE_REFERRAL_REVIEW: 'ncd_glucose_referral_review',
});

module.exports = [
  // ── Task: Physician Review ← triggered by oral_cancer_assessment ─────────────
  {
    name: 'physician_review_from_oral_assessment',
    icon: 'icon-disease-cancer',
    title: 'Physician Oral Cancer Review',
    appliesTo: 'reports',
    appliesToType: [AppForms.ORAL_CANCER_ASSESSMENT],
    appliesIf: function (contact, report) {
      var facility = getField(report, 'final_ai_analysis_page.referral_location') || '';
      if (!facility || facility === 'dh') { return false; }
      if (facility === 'phc') { return user.role === UserRole.PHYSICIAN && isAlive(contact); }
      if (facility === 'chc') { return user.role === UserRole.MEDICAL_OFFICER && isAlive(contact); }
      return false;
    },
    resolvedIf: function (contact, report) {
      return contact.reports.some(function (r) {
        return r.form === AppForms.PHYSICIAN_ORAL_CANCER_REVIEW &&
          !r.deleted &&
          r.fields &&
          r.fields.source_form_uuid === report._id;
      });
    },
    actions: [
      {
        type: 'report',
        form: AppForms.PHYSICIAN_ORAL_CANCER_REVIEW,
        label: 'Review Oral Cancer Photos',
        modifyContent: function (content, contact, report) {
          content.inputs = content.inputs || {};
          content.inputs.source_form_uuid_input = report._id;
          // NEW: pass referred-by and referral facility to the form
          content.inputs.t_cho_name          = getField(report, 'reporter_name') || '';
          content.inputs.t_referral_facility = getField(report, 'final_ai_analysis_page.referral_location') || '';
          // Photo attachments
          for (var i = 1; i <= 8; i++) {
            var page = getField(report, 'photo_' + i + '_page') || {};
            var val  = (page && page['photo_' + i]) || '';
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

  // ── Task: Physician Review ← triggered by ncd (oral cancer section) ─────────
  {
    name: 'physician_review_from_ncd',
    icon: 'icon-disease-cancer',
    title: 'Physician Oral Cancer Review',
    appliesTo: 'reports',
    appliesToType: [AppForms.NCD],
    appliesIf: function (contact, report) {
      var facility = getField(report, 'oc_section_wrapper.oc_final_ai_analysis_page.oc_referral_location') || '';
      if (!facility || facility === 'dh') { return false; }
      if (facility === 'phc') { return user.role === UserRole.PHYSICIAN && isAlive(contact); }
      if (facility === 'chc') { return user.role === UserRole.MEDICAL_OFFICER && isAlive(contact); }
      return false;
    },
    resolvedIf: function (contact, report) {
      return contact.reports.some(function (r) {
        return r.form === AppForms.PHYSICIAN_ORAL_CANCER_REVIEW &&
          !r.deleted &&
          r.fields &&
          r.fields.source_form_uuid === report._id;
      });
    },
    actions: [
      {
        type: 'report',
        form: AppForms.PHYSICIAN_ORAL_CANCER_REVIEW,
        label: 'Review Oral Cancer Photos',
        modifyContent: function (content, contact, report) {
          content.inputs = content.inputs || {};
          content.inputs.source_form_uuid_input = report._id;
          // NEW: pass referred-by and referral facility to the form
          content.inputs.t_cho_name          = getField(report, 'reporter_name') || '';
          content.inputs.t_referral_facility = getField(report, 'oc_section_wrapper.oc_final_ai_analysis_page.oc_referral_location') || '';
          // Photo attachments (NCD uses oc_photo_N prefix)
          for (var i = 1; i <= 8; i++) {
            var page = getField(report, 'oc_section_wrapper.oc_photo_' + i + '_page') || {};
            var val  = (page && page['oc_photo_' + i]) || '';
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
    appliesToType: [AppForms.PHYSICIAN_ORAL_CANCER_REVIEW],
    appliesIf: function (contact, report) {
      return user.role === UserRole.ASHA && !report.deleted;
    },
    resolvedIf: function (contact, report) {
      // Resolved once a phq9_followup_actions form is submitted after the physician review
      return contact.reports.some(function (r) {
        return r.form === AppForms.PHQ9_FOLLOWUP_ACTIONS &&
          !r.deleted &&
          r.reported_date >= report.reported_date;
      });
    },
    actions: [
      {
        type: 'report',
        form: AppForms.PHQ9_FOLLOWUP_ACTIONS,
        label: 'Complete PHQ-9 Follow-up',
        modifyContent: function (content, contact, report) {
          var fields = report.fields || {};
          // Pass physician review context into the PHQ-9 follow-up form
          content.previous_score = fields.previous_score || '';
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
    appliesToType: [AppForms.CBAC],
    appliesIf: function (contact, report) {
      if (user.role !== UserRole.ASHA || getField(report, 'risk_category') !== 'High Risk' || !isAlive(contact)) {
        return false;
      }
      // Only apply to the most recent CBAC — older ones are superseded by the new submission
      const newestCbac = getNewestReport(contact.reports, ['cbac']);
      return newestCbac && newestCbac._id === report._id;
    },
    resolvedIf: function (contact, report) {
      // Resolved once any cbac_followup is submitted after this cbac report
      return contact.reports.some(function (r) {
        // Resolve if this NCD was opened from this specific CBAC task
        if (r.fields && r.fields.inputs && r.fields.inputs.cbac_source_id === report._id) {
          return true;
        }
        return r.form === AppForms.CBAC_FOLLOWUP && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.CBAC_FOLLOWUP,
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
    appliesToType: [AppForms.CBAC],
    appliesIf: function (contact, report) {
      if (user.role !== UserRole.CHO) { return false; }
      if (!isAlive(contact)) { return false; }
      // Only trigger if PHQ-2 score is high enough to warrant follow-up
      const phq2Total = parseInt(getField(report, 'phq2_total'));
      if (phq2Total <= 3) { return false; }
      // Only apply to the most recent CBAC — older ones are superseded by the new submission
      const newestCbac = getNewestReport(contact.reports, ['cbac']);
      return newestCbac && newestCbac._id === report._id;
    },
    resolvedIf: function (contact, report) {
      // Resolve if a newer CBAC exists — the old task is superseded
      const newerCbac = getNewestReport(contact.reports, ['cbac']);
      if (newerCbac && newerCbac.reported_date > report.reported_date) { return true; }
      // Resolve once any phq9 form is submitted after this cbac report
      return contact.reports.some(function (r) {
        return r.form === AppForms.PHQ9 && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.PHQ9,
      label: 'task.cbac.phq9_followup.action_label',
      modifyContent: function (content, _contact, report) {
        content.state = getField(report, 'inputs.state');
        content.district = getField(report, 'inputs.district');
        content.cbac_source_id = report._id;
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
    appliesToType: [AppForms.CBAC],
    appliesIf: function (contact, report) {
      if (user.role !== UserRole.CHO) { return false; }
      if (getField(report, 'risk_category') !== 'High Risk') { return false; }
      if (!isAlive(contact)) { return false; }
      // Only apply to the most recent CBAC — when a new CBAC is submitted the old task disappears
      const newestCbac = getNewestReport(contact.reports, ['cbac']);
      return newestCbac && newestCbac._id === report._id;
    },
    resolvedIf: function (contact, report) {
      // Resolved once any ncd form is submitted after this cbac report
      return contact.reports.some(function (r) {
        if (r.form !== AppForms.NCD) { return false; }
        // Fallback: resolve on any NCD submitted after this CBAC
        return r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.NCD,
      label: 'NCD Screening',
      modifyContent: function (content, _contact, report) {
        content.state = getField(report, 'inputs.state');
        content.district = getField(report, 'inputs.district');
        content.cbac_source_id = report._id;
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

  // CBAC Task: High Risk Referral Review — shown to CHO when CBAC score is High Risk
  // Auto-closes when cbac.ncd_screening is resolved (NCD form submitted after this CBAC)
  {
    name: 'cbac.referral_review.high_risk',
    icon: 'icon-healthcare-generic-2',
    title: 'CBAC High Risk Referral Review',
    appliesTo: 'reports',
    appliesToType: [AppForms.CBAC],
    appliesIf: function (contact, report) {
      if (user.role !== UserRole.CHO) { return false; }
      if (!isAlive(contact)) { return false; }
      return getField(report, 'risk_category') === 'High Risk';
    },
    resolvedIf: function (contact, report) {
      // Auto-close when NCD screening is done (mirrors cbac.ncd_screening resolution)
      return contact.reports.some(function (r) {
        if (r.form === AppForms.NCD) {
          if (r.fields && r.fields.inputs && r.fields.inputs.cbac_source_id === report._id) { return true; }
          return r.reported_date > report.reported_date;
        }
        return r.form === AppForms.CBAC_REFERRAL_REVIEW_HIGH_RISK &&
          r.fields && r.fields.inputs && r.fields.inputs.cbac_source_id === report._id;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.CBAC_REFERRAL_REVIEW_HIGH_RISK,
      label: 'Review High Risk CBAC Referral',
      modifyContent: function (content, _contact, report) {
        content.t_asha_name = getField(report, 'reporter_name');
        content.t_total_score = getField(report, 'total_score');
        content.t_risk_category = getField(report, 'risk_category');
        content.t_phq2_total = getField(report, 'phq2_total') || '0';
        content.t_referral_reason = 'High CBAC Risk Score (' + getField(report, 'total_score') + ')';
        content.cbac_source_id = report._id;
      }
    }],
    events: [{
      id: 'cbac-referral-review-high-risk',
      days: 0,
      start: 0,
      end: 30,
    }],
  },

  // CBAC Task: PHQ-2 Referral Review — shown to CHO when PHQ-2 score > 3
  // Auto-closes when cbac.phq9_followup is resolved (PHQ9 form submitted after this CBAC)
  {
    name: 'cbac.referral_review.phq2',
    icon: 'icon-healthcare-generic-2',
    title: 'CBAC PHQ-2 Referral Review',
    appliesTo: 'reports',
    appliesToType: [AppForms.CBAC],
    appliesIf: function (contact, report) {
      if (user.role !== UserRole.CHO) { return false; }
      if (!isAlive(contact)) { return false; }
      return parseInt(getField(report, 'phq2_total')) > 3;
    },
    resolvedIf: function (contact, report) {
      // Auto-close when a PHQ9 linked to this CBAC is submitted (via cbac.phq9_followup task)
      const newerCbac = getNewestReport(contact.reports, ['cbac']);
      if (newerCbac && newerCbac.reported_date > report.reported_date) { return true; }
      return contact.reports.some(function (r) {
        if (r.form === AppForms.PHQ9) {
          return r.fields && r.fields.inputs && r.fields.inputs.cbac_source_id === report._id;
        }
        return r.form === AppForms.CBAC_REFERRAL_REVIEW_PHQ2 &&
          r.fields && r.fields.inputs && r.fields.inputs.cbac_source_id === report._id;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.CBAC_REFERRAL_REVIEW_PHQ2,
      label: 'Review PHQ-2 CBAC Referral',
      modifyContent: function (content, _contact, report) {
        content.t_asha_name = getField(report, 'reporter_name');
        content.t_total_score = getField(report, 'total_score');
        content.t_risk_category = getField(report, 'risk_category');
        content.t_phq2_total = getField(report, 'phq2_total') || '0';
        content.t_referral_reason = 'High PHQ-2 Score (' + getField(report, 'phq2_total') + ')';
        content.cbac_source_id = report._id;
      }
    }],
    events: [{
      id: 'cbac-referral-review-phq2',
      days: 0,
      start: 0,
      end: 30,
    }],
  },

  // Task 2: CBAC Checkup Date Follow-up — triggered when patient agreed to checkup date
  {
    name: 'cbac.checkup_date_follow_up',
    icon: 'icon-healthcare',
    title: 'task.cbac.checkup_date_follow_up.title',
    appliesTo: 'reports',
    appliesToType: [AppForms.CBAC_FOLLOWUP],
    appliesIf: function (contact, report) {
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
      const followupCount = contact.reports.filter(function (r) {
        return r.form === AppForms.CBAC_FOLLOWUP && r.reported_date > newestCbacDate;
      }).length;
      return followupCount <= 2;
    },
    resolvedIf: function (contact, report) {
      // Resolved when any newer cbac_followup is submitted — supersedes this scheduled task
      return contact.reports.some(function (r) {
        return r.form === AppForms.CBAC_FOLLOWUP && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.CBAC_FOLLOWUP,
      label: 'CBAC Checkup Follow-up'
    }],
    events: [{
      id: 'cbac-checkup-date-follow-up',
      // Production: use date entered by ASHA in previous cbac_followup
      dueDate: function (event, contact, report) {
        return getDateISOLocal(getField(report, 'ncd_followup.t_checkup_date'));
      },
      // start: 1,
      start: 0,  // DEV: immediate
      end: 7,
    }],
  },

  // NCD Task: BP Referral Review — shown to Physician (PHC) or Medical Officer (CHC)
  {
    name: 'ncd.bp_referral_review',
    icon: 'icon-healthcare-generic-2',
    title: 'NCD BP Referral Review',
    appliesTo: 'reports',
    appliesToType: [AppForms.NCD],
    appliesIf: function (contact, report) {
      const facility =
        getField(report, 'f2_bp_referral_facility_page.f2_bp_referral_facility') ||
        getField(report, 'f2_bp_normal_referral_facility_page.f2_bp_normal_referral_facility');
      if (!facility || facility === 'dh') { return false; }
      if (facility === 'phc') { return user.role === UserRole.PHYSICIAN && isAlive(contact); }
      if (facility === 'chc') { return user.role === UserRole.MEDICAL_OFFICER && isAlive(contact); }
      return false;
    },
    resolvedIf: function (contact, report) {
      return contact.reports.some(function (r) {

        // Close if this NCD Hypertension Referral is submitted for this NCD
        const isHypertensionReferral = r.form === AppForms.NCD_HYPERTENSION_REFERRAL &&
          r.fields && r.fields.inputs && r.fields.inputs.ncd_source_id === report._id;

        // Close if this NCD BP Referral Review is submitted after this NCD Report
        const isBpReferralReview = r.form === AppForms.NCD_HYPERTENSION_REFERRAL_REVIEW &&
          r.fields && r.fields.inputs && r.fields.inputs.ncd_source_id === report._id;

        return isHypertensionReferral || isBpReferralReview;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.NCD_HYPERTENSION_REFERRAL_REVIEW,
      label: 'Review BP Referral',
      modifyContent: function (content, _contact, report) {
        content.t_cho_name = getField(report, 'reporter_name');
        content.t_referral_facility =
          getField(report, 'f2_bp_referral_facility_page.f2_bp_referral_facility') ||
          getField(report, 'f2_bp_normal_referral_facility_page.f2_bp_normal_referral_facility') || '';
        content.t_bp_systolic = getField(report, 'f2_hypertension.f2_systolic');
        content.t_bp_diastolic = getField(report, 'f2_hypertension.f2_diastolic');
        content.t_glucose = getField(report, 'f2_diabetes_section.f2_rapid_glucose');
        content.ncd_source_id = report._id;
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
    appliesToType: [AppForms.NCD],
    appliesIf: function (contact, report) {
      const facility =
        getField(report, 'f2_glucose_referral_facility_page.f2_glucose_referral_facility') ||
        getField(report, 'f2_glucose_normal_referral_facility_page.f2_glucose_normal_referral_facility');
      if (!facility || facility === 'dh') { return false; }
      if (facility === 'phc') { return user.role === UserRole.PHYSICIAN && isAlive(contact); }
      if (facility === 'chc') { return user.role === UserRole.MEDICAL_OFFICER && isAlive(contact); }
      return false;
    },
    resolvedIf: function (contact, report) {
      return contact.reports.some(function (r) {
        
        console.log('r.form', r.form);
        console.log('r.fields', r.fields);
        console.log('r.fields.inputs', r.fields.inputs);
        console.log('r.fields.inputs.ncd_source_id', r.fields.inputs.ncd_source_id);
        console.log('report._id', report._id);

        const isGlucoseReferralReview = r.form === AppForms.NCD_GLUCOSE_REFERRAL_REVIEW &&
          r.fields && r.fields.inputs && r.fields.inputs.ncd_source_id === report._id;

        const isDiabetesReferral = r.form === AppForms.NCD_DIABETES_REFERRAL &&
          r.fields && r.fields.inputs && r.fields.inputs.ncd_source_id === report._id;

        return isGlucoseReferralReview || isDiabetesReferral;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.NCD_GLUCOSE_REFERRAL_REVIEW,
      label: 'Review Glucose Referral',
      modifyContent: function (content, _contact, report) {
        content.t_cho_name = getField(report, 'reporter_name');
        content.t_referral_facility =
          getField(report, 'f2_glucose_referral_facility_page.f2_glucose_referral_facility') ||
          getField(report, 'f2_glucose_normal_referral_facility_page.f2_glucose_normal_referral_facility') || '';
        content.t_bp_systolic = getField(report, 'f2_hypertension.f2_systolic');
        content.t_bp_diastolic = getField(report, 'f2_hypertension.f2_diastolic');
        content.t_glucose = getField(report, 'f2_diabetes_section.f2_rapid_glucose');
        content.ncd_source_id = report._id;
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
    appliesToType: [AppForms.NCD],
    appliesIf: function (contact, report) {
      const userRole = user.role;
      const systolic = parseInt(getField(report, 'f2_hypertension.f2_systolic'));
      const diastolic = parseInt(getField(report, 'f2_hypertension.f2_diastolic'));
      // Moderate: both elevated, but NOT in severe range (severe task takes priority)
      const isModerate = systolic > 120 && diastolic > 80;
      const isSevere = systolic > 140 || diastolic > 90;
      return userRole === UserRole.ASHA && isModerate && !isSevere && isAlive(contact);
    },
    resolvedIf: function (contact, report) {
      // Resolve if a newer NCD report exists — re-assessment supersedes this task
      const newerNcd = getNewestReport(contact.reports, ['ncd']);
      if (newerNcd && newerNcd.reported_date > report.reported_date) { return true; }
      // Resolve once any hypertension follow-up form is submitted after this ncd report
      return contact.reports.some(function (r) {
        return r.form === AppForms.NCD_HYPERTENSION_FOLLOWUP && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.NCD_HYPERTENSION_FOLLOWUP,
      label: 'Hypertension Follow-up',
      modifyContent: function (content, _contact, report) {
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
    appliesToType: [AppForms.NCD],
    appliesIf: function (contact, report) {
      const userRole = user.role;
      const isReferred = getField(report, 'f2_bp_referral_page.f2_bp_referral_decision') === 'refer_anyway' || getField(report, 'f2_bp_normal_page.f2_bp_referral_decision_normal') === 'refer_anyway';
      return userRole === UserRole.ASHA && isReferred && isAlive(contact);
    },
    resolvedIf: function (contact, report) {
      // Resolve if a newer NCD report exists (re-assessment happened)
      const newerNcd = getNewestReport(contact.reports, ['ncd']);
      if (newerNcd && newerNcd.reported_date > report.reported_date) { return true; }

      // Resolve once a ncd_hypertension_referral linked to this NCD is submitted
      return contact.reports.some(function (r) {
        return r.form === AppForms.NCD_HYPERTENSION_REFERRAL &&
          r.fields && r.fields.inputs && r.fields.inputs.ncd_source_id === report._id;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.NCD_HYPERTENSION_REFERRAL,
      label: 'Hypertension Referral Follow-up',
      modifyContent: function (content, _contact, report) {
        content.t_systolic = getField(report, 'f2_hypertension.f2_systolic');
        content.t_diastolic = getField(report, 'f2_hypertension.f2_diastolic');
        content.ncd_source_id = report._id;
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
    appliesToType: [AppForms.NCD_HYPERTENSION_REFERRAL],
    appliesIf: function (contact, report) {
      // Only trigger on reports where the patient agreed but hasn't visited yet
      // t_phc_visited being set means this is a completed follow-up, not an initial referral
      return user.role === UserRole.ASHA &&
        getField(report, 'referral.t_willing_to_visit') === 'yes' &&
        getField(report, 'referral.t_phc_visit_date') &&
        getField(report, 'referral.t_phc_visited') !== 'yes' &&
        isAlive(contact);
    },
    resolvedIf: function (contact, report) {
      // Resolved when any newer ncd_hypertension_referral is submitted — the scheduled
      // task is superseded by the follow-up regardless of its outcome
      return contact.reports.some(function (r) {
        return r.form === AppForms.NCD_HYPERTENSION_REFERRAL && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.NCD_HYPERTENSION_REFERRAL,
      label: 'Hypertension Referral Follow-up',
      modifyContent: function (content, _contact, report) {
        content.t_systolic = getField(report, 'inputs.t_systolic');
        content.t_diastolic = getField(report, 'inputs.t_diastolic');
        content.t_referral_facility = getField(report, 'inputs.t_referral_facility') || 'phc';
      }
    }],
    events: [{
      id: 'ncd-hypertension-referral-scheduled',
      start: 3,
      end: 7,
      dueDate: function (_event, _contact, report) {
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
    appliesToType: [AppForms.NCD],
    appliesIf: function (contact, report) {
      const userRole = user.role;

      const isReferred = getField(report, 'f2_glucose_referral_page.f2_glucose_referral_decision') === 'refer_anyway' || getField(report, 'f2_glucose_normal_page.f2_glucose_referral_decision_normal') === 'refer_anyway';

      return userRole === UserRole.ASHA && isReferred && isAlive(contact);
    },
    resolvedIf: function (contact, report) {
      // Resolve if a newer NCD report exists (re-assessment happened)
      const newerNcd = getNewestReport(contact.reports, ['ncd']);
      if (newerNcd && newerNcd.reported_date > report.reported_date) { return true; }

      // Resolve once a ncd_diabetes_referral linked to this NCD is submitted
      return contact.reports.some(function (r) {
        return r.form === AppForms.NCD_DIABETES_REFERRAL &&
          r.fields && r.fields.inputs && r.fields.inputs.ncd_source_id === report._id;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.NCD_DIABETES_REFERRAL,
      label: 'Diabetes Referral Follow-up',
      modifyContent: function (content, _contact, report) {
        content.t_rapid_glucose = getField(report, 'f2_diabetes_section.f2_rapid_glucose');
        content.ncd_source_id = report._id;
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
    appliesToType: [AppForms.NCD_DIABETES_REFERRAL],
    appliesIf: function (contact, report) {
      // Only trigger on reports where the patient agreed but hasn't visited yet
      // t_phc_visited being set means this is a completed follow-up, not an initial referral
      return user.role === UserRole.ASHA &&
        getField(report, 'referral.t_willing_to_visit') === 'yes' &&
        getField(report, 'referral.t_phc_visit_date') &&
        getField(report, 'referral.t_phc_visited') !== 'yes' &&
        isAlive(contact);
    },
    resolvedIf: function (contact, report) {
      // Resolved when any newer ncd_diabetes_referral is submitted — the scheduled
      // task is superseded by the follow-up regardless of its outcome
      return contact.reports.some(function (r) {
        return r.form === AppForms.NCD_DIABETES_REFERRAL && r.reported_date > report.reported_date;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.NCD_DIABETES_REFERRAL,
      label: 'Diabetes Referral Follow-up',
      modifyContent: function (content, _contact, report) {
        content.t_rapid_glucose = getField(report, 'inputs.t_rapid_glucose');
        content.t_referral_facility = getField(report, 'inputs.t_referral_facility') || 'phc';
      }
    }],
    events: [{
      id: 'ncd-diabetes-referral-scheduled',
      start: 3,
      end: 7,
      dueDate: function (_event, _contact, report) {
        return getDateISOLocal(getField(report, 'referral.t_phc_visit_date'));
      }
    }],
  },
  {
    name: 'phq9.referral_review',
    icon: 'icon-healthcare-generic-2',
    title: 'PHQ-9 Referral Review',
    appliesTo: 'reports',
    appliesToType: [AppForms.PHQ9],
    appliesIf: function (contact, report) {
      const facility = getField(report, 'referral_page.referral_location');
      if (!facility || facility === 'dh') { return false; }
      if (facility === 'phc') { return user.role === UserRole.PHYSICIAN && isAlive(contact); }
      if (facility === 'chc') { return user.role === UserRole.MEDICAL_OFFICER && isAlive(contact); }
      return false;
    },
    resolvedIf: function (contact, report) {
      return contact.reports.some(function (r) {
        const isPHQ9ReferralReview = r.form === AppForms.PHQ9_REFERRAL_REVIEW &&
          r.fields && r.fields.inputs && r.fields.inputs.phq9_source_id === report._id;
        return isPHQ9ReferralReview;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.PHQ9_REFERRAL_REVIEW,
      label: 'Review PHQ-9 Referral',
      modifyContent: function (content, _contact, report) {
        content.t_cho_name          = getField(report, 'reporter_name');
        content.t_referral_facility = getField(report, 'referral_page.referral_location') || '';
        content.t_phq_score         = getField(report, 'total_score') || '';
        content.t_severity          = getField(report, 'severity_category') || '';
        content.phq9_source_id      = report._id;
      }
    }],
    events: [{
      id: 'phq9-referral-review',
      days: 0,
      start: 0,
      end: 30,
    }],
  },
  {
    name: 'ncd.phq9_referral_review',
    icon: 'icon-healthcare-generic-2',
    title: 'NCD PHQ-9 Referral Review',
    appliesTo: 'reports',
    appliesToType: [AppForms.NCD],
    appliesIf: function (contact, report) {
      const facility = getField(report, 'phq_section_wrapper.phq_referral_page.phq_referral_location');
      if (!facility || facility === 'dh') { return false; }
      if (facility === 'phc') { return user.role === UserRole.PHYSICIAN && isAlive(contact); }
      if (facility === 'chc') { return user.role === UserRole.MEDICAL_OFFICER && isAlive(contact); }
      return false;
    },
    resolvedIf: function (contact, report) {
      return contact.reports.some(function (r) {
        return r.form === AppForms.PHQ9_REFERRAL_REVIEW &&
          r.fields && r.fields.inputs && r.fields.inputs.phq9_source_id === report._id;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.PHQ9_REFERRAL_REVIEW,
      label: 'Review PHQ-9 Referral',
      modifyContent: function (content, _contact, report) {
        content.t_cho_name          = getField(report, 'reporter_name');
        content.t_referral_facility = getField(report, 'phq_section_wrapper.phq_referral_page.phq_referral_location') || '';
        content.t_phq_score         = getField(report, 'phq_section_wrapper.phq_total_score') || '';
        content.t_severity          = getField(report, 'phq_section_wrapper.phq_severity_category') || '';
        content.phq9_source_id      = report._id;
      }
    }],
    events: [{
      id: 'ncd-phq9-referral-review',
      days: 0,
      start: 0,
      end: 30,
    }],
  },
  {
    name: 'bc.referral_review',
    icon: 'icon-people-woman',
    title: 'Breast Cancer Referral Review',
    appliesTo: 'reports',
    appliesToType: [AppForms.BC_RISK_ASSESSMENT],
    appliesIf: function (contact, report) {
      var facility = getField(report, 'referral_page.referral_location');
      if (!facility || facility === 'dh') { return false; }
      if (facility === 'phc') { return user.role === UserRole.PHYSICIAN && isAlive(contact); }
      if (facility === 'chc') { return user.role === UserRole.MEDICAL_OFFICER && isAlive(contact); }
      return false;
    },
    resolvedIf: function (contact, report) {
      return contact.reports.some(function (r) {
        return r.form === AppForms.BC_REFERRAL_REVIEW &&
          !r.deleted &&
          r.fields && r.fields.inputs && r.fields.inputs.bc_source_id === report._id;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.BC_REFERRAL_REVIEW,
      label: 'Review Breast Cancer Referral',
      modifyContent: function (content, _contact, report) {
        content.bc_source_id        = report._id;
        content.t_cho_name          = getField(report, 'reporter_name') || '';
        content.t_referral_facility = getField(report, 'referral_page.referral_location') || '';
        // symptom_detected is a calculate field at the top level of the form
        content.t_symptom_detected  = getField(report, 'symptom_detected') || '';
      }
    }],
    events: [{
      id: 'bc-referral-review',
      days: 0,
      start: 0,
      end: 30,
    }],
  },
  {
    name: 'ncd.bc_referral_review',
    icon: 'icon-people-woman',
    title: 'Breast Cancer Referral Review',
    appliesTo: 'reports',
    appliesToType: [AppForms.NCD],
    appliesIf: function (contact, report) {
 
      var facility = getField(report, 'bc_section_wrapper.bc_referral_page.bc_referral_location');
      if (!facility || facility === 'dh') { return false; }
      if (facility === 'phc') { return user.role === UserRole.PHYSICIAN && isAlive(contact); }
      if (facility === 'chc') { return user.role === UserRole.MEDICAL_OFFICER && isAlive(contact); }
      return false;
    },
    resolvedIf: function (contact, report) {
      return contact.reports.some(function (r) {
        return r.form === AppForms.BC_REFERRAL_REVIEW &&
          !r.deleted &&
          r.fields && r.fields.inputs && r.fields.inputs.bc_source_id === report._id;
      });
    },
    actions: [{
      type: 'report',
      form: AppForms.BC_REFERRAL_REVIEW,
      label: 'Review Breast Cancer Referral',
      modifyContent: function (content, _contact, report) {
        content.bc_source_id        = report._id;
        content.t_cho_name          = getField(report, 'reporter_name') || '';
        content.t_referral_facility = getField(report, 'bc_section_wrapper.bc_referral_page.bc_referral_location') || '';
        // bc_symptom_detected is a calculate field inside bc_section_wrapper
        content.t_symptom_detected  = getField(report, 'bc_section_wrapper.bc_symptom_detected') || '';
      }
    }],
    events: [{
      id: 'ncd-bc-referral-review',
      days: 0,
      start: 0,
      end: 30,
    }],
  }


];




