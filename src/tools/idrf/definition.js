/**
 * Neuroblastoma Image-Defined Risk Factors (IDRF) — INRG Staging System.
 * Binary assessment: any IDRF present → L2, none → L1.
 *
 * Reference: Monclair T et al. J Clin Oncol 2009;27(2):298-303.
 */
export const idrfDefinition = {
  id: 'idrf',
  name: 'Neuroblastoma IDRF',
  version: '1.0.0',
  description:
    'Image-Defined Risk Factors for neuroblastoma — INRG staging system (L1 vs L2).',
  cdeSetId: null,

  primaryInputs: [
    {
      id: 'location',
      label: 'Primary Tumor Location',
      inputType: 'single-select',
      options: [
        { id: 'cervical', label: 'Cervical' },
        { id: 'thoracic', label: 'Thoracic / Posterior mediastinum' },
        { id: 'abdominal', label: 'Abdominal / Retroperitoneal' },
        { id: 'pelvic', label: 'Pelvic' },
        { id: 'adrenal', label: 'Adrenal' },
      ],
    },
  ],

  // IDRFs grouped by anatomical region
  idrfGroups: [
    {
      id: 'multiCompartment',
      title: 'Multiple Body Compartments',
      factors: [
        {
          id: 'crossCompartment',
          label: 'Ipsilateral tumor extension within two body compartments',
          tooltip: 'Tumor extends across neck-chest, chest-abdomen, or abdomen-pelvis',
        },
      ],
    },
    {
      id: 'neck',
      title: 'Neck',
      factors: [
        {
          id: 'carotidEncasement',
          label: 'Carotid / vertebral artery / IJV encasement',
          tooltip: 'Encasement (>50% circumference) of carotid artery, vertebral artery, and/or internal jugular vein',
        },
        {
          id: 'skullBase',
          label: 'Skull base extension',
          tooltip: 'Tumor extends to the skull base',
        },
        {
          id: 'trachealCompressionNeck',
          label: 'Tracheal compression',
          tooltip: 'Tracheal compression with reduced short-axis diameter',
        },
      ],
    },
    {
      id: 'cervicothoracic',
      title: 'Cervico-Thoracic Junction',
      factors: [
        {
          id: 'brachialPlexus',
          label: 'Brachial plexus encasement',
          tooltip: 'Tumor encases the brachial plexus',
        },
        {
          id: 'subclavian',
          label: 'Subclavian vessel encasement',
          tooltip: 'Encasement of subclavian vessels with or without vertebral or carotid artery involvement',
        },
      ],
    },
    {
      id: 'thoracic',
      title: 'Thorax',
      factors: [
        {
          id: 'aortaThoracic',
          label: 'Thoracic aorta / major branch encasement',
          tooltip: 'Encasement (>50% circumference) of the thoracic aorta and/or its major branches',
        },
        {
          id: 'airwayThoracic',
          label: 'Tracheal / principal bronchial compression',
          tooltip: 'Compression of trachea or principal bronchi with reduced short-axis diameter',
        },
        {
          id: 'costovertebral',
          label: 'Lower mediastinal tumor infiltrating costovertebral junction (T9-T12)',
          tooltip: 'Infiltration of costovertebral junction between T9 and T12 vertebral levels',
        },
      ],
    },
    {
      id: 'thoracoabdominal',
      title: 'Thoraco-Abdominal',
      factors: [
        {
          id: 'vcAortaAbdominal',
          label: 'Abdominal aorta / vena cava encasement',
          tooltip: 'Encasement (>50% circumference) of abdominal aorta and/or inferior vena cava',
        },
      ],
    },
    {
      id: 'abdominal',
      title: 'Abdomen / Pelvis',
      factors: [
        {
          id: 'portaHepatis',
          label: 'Porta hepatis infiltration',
          tooltip: 'Tumor infiltrates the porta hepatis',
        },
        {
          id: 'hepatoduodenal',
          label: 'Hepatoduodenal ligament infiltration',
          tooltip: 'Tumor infiltrates the hepatoduodenal ligament',
        },
        {
          id: 'smaBranch',
          label: 'SMA branch encasement at mesenteric root',
          tooltip: 'Encasement of superior mesenteric artery branches at the mesenteric root',
        },
        {
          id: 'celiacAxis',
          label: 'Celiac axis / SMA origin encasement',
          tooltip: 'Encasement (>50% circumference) of the celiac axis and/or SMA origin',
        },
        {
          id: 'renalPedicle',
          label: 'Renal pedicle invasion',
          tooltip: 'Involvement of renal vessels/pedicle (unilateral or bilateral)',
        },
        {
          id: 'iliac',
          label: 'Iliac vessel encasement',
          tooltip: 'Encasement (>50% circumference) of iliac vessels',
        },
        {
          id: 'sciaticNotch',
          label: 'Pelvic tumor crossing sciatic notch',
          tooltip: 'Tumor extends through the sciatic notch',
        },
      ],
    },
    {
      id: 'organInfiltration',
      title: 'Adjacent Organ Infiltration',
      factors: [
        {
          id: 'organInfiltration',
          label: 'Infiltration of adjacent organs/structures',
          tooltip: 'Infiltration of pericardium, diaphragm, kidney, liver, duodeno-pancreatic block, or mesentery',
        },
      ],
    },
    {
      id: 'intraspinal',
      title: 'Intraspinal Extension',
      factors: [
        {
          id: 'spinalCanal',
          label: 'Spinal canal invasion (>1/3 axial diameter)',
          tooltip: 'More than one-third of spinal canal invaded in axial plane, and/or obliterated leptomeningeal spaces, and/or spinal cord signal abnormality on MRI',
        },
      ],
    },
  ],

  parseRules: {
    location: {
      options: {
        'cervical': ['neck mass', 'cervical mass', 'cervical neuroblastoma'],
        'thoracic': ['posterior mediastinal', 'posterior mediastinum', 'paravertebral thoracic', 'thoracic mass'],
        'abdominal': ['retroperitoneal', 'abdominal mass', 'retroperitoneal mass'],
        'pelvic': ['pelvic mass', 'presacral', 'pelvic neuroblastoma'],
        'adrenal': ['adrenal mass', 'adrenal neuroblastoma', 'suprarenal'],
      },
    },
    selectedFactors: {
      multi: true,
      options: {
        crossCompartment: ['crosses compartment', 'two body compartments', 'multi-compartment', 'neck-chest', 'chest-abdomen'],
        carotidEncasement: ['carotid encasement', 'carotid artery encased', 'vertebral artery encasement', 'ijv encasement'],
        skullBase: ['skull base extension', 'skull base involvement'],
        trachealCompressionNeck: ['tracheal compression', 'trachea compressed'],
        brachialPlexus: ['brachial plexus', 'plexus encasement'],
        subclavian: ['subclavian', 'subclavian vessel'],
        aortaThoracic: ['aorta encasement', 'aortic encasement', 'thoracic aorta'],
        airwayThoracic: ['bronchial compression', 'bronchus compressed', 'airway compression'],
        costovertebral: ['costovertebral', 'costovertebral junction'],
        vcAortaAbdominal: ['abdominal aorta encased', 'vena cava encased', 'ivc encasement'],
        portaHepatis: ['porta hepatis', 'portal infiltration'],
        hepatoduodenal: ['hepatoduodenal', 'hepatoduodenal ligament'],
        smaBranch: ['sma branch', 'mesenteric root', 'superior mesenteric'],
        celiacAxis: ['celiac axis', 'celiac trunk', 'sma origin'],
        renalPedicle: ['renal pedicle', 'renal vessel invasion', 'renal artery encased'],
        iliac: ['iliac vessel', 'iliac artery', 'iliac vein'],
        sciaticNotch: ['sciatic notch', 'sciatic foramen'],
        organInfiltration: ['organ infiltration', 'pericardial infiltration', 'diaphragm infiltration', 'kidney infiltration', 'liver infiltration'],
        spinalCanal: ['spinal canal', 'intraspinal', 'epidural extension', 'spinal cord compression'],
      },
    },
  },
};
