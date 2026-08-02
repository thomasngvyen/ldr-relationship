export const CARRIER_GATEWAYS = {
    VERIZON: 'vtext.com',
    ATT: 'txt.att.net',
    TMOBILE: 'tmomail.net',
    SPRINT: 'messaging.sprintpcs.com',
    US_CELLULAR: 'email.uscc.net',
    CRICKET: 'mms.cricketwireless.com',
    BOOST: 'sms.myboostmobile.com',
    METRO: 'mymetropcs.com',
  } as const;

  export type CarrierKey = keyof typeof CARRIER_GATEWAYS;