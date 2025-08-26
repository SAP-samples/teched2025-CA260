const cds = require('@sap/cds')
class ProcessorService extends cds.ApplicationService {

  async init() {
/**
 * STEP 4.2.3: We instruct CAP to use the notifications plugin.
 * This is responsible talking to the Alert Notification Service which is part of SAP Build Work Zone.
 * As a prerequisite, the plugin has been added to the package.json file as dependency "@cap-js/notifications".
 * Uncomment the below snippet as instructed in your hands-on material.
 */

/*     
    const alert = await cds.connect.to('notifications')
    const { Incidents } = this.entities
*/

/**
 * STEP 4.2.4: This snippet will send a notification upon creation of an incident.
 * For this we use the lifecycle event "CREATE" to run logic after the event occurs.
 * "alert.notify" is the method to send notifications.
 * We reference the notification template "IncidentCreated" and fill needed data.
 * Uncomment the below snippet as instructed in your hands-on material.
 */

/* 
    this.after('CREATE', Incidents, async incident => {
      let [ customer, supporters ] = await Promise.all ([
        getCustomerDataFor(incident),
        getResponsibleSupportersFor(incident)
      ])
      await alert.notify ('IncidentCreated', {
        recipients: supporters, // for demo purposes, we will deliver the notificaiton to ourself
        priority: { H: 'HIGH', L: 'LOW' }[incident.urgency_code],
        data: {
          customer: customer.info,
          description: incident.title,
        },
        ...getNavigationPropertiesFor(incident)
      })
    })
 */

/**
 * STEP 4.2.5: This snippet will send a notification when an incident is resolved.
 * This time, we make use of the lifecycle method "UPDATE" and have an additional check for the status "Closed"
 * Uncomment the below snippet as instructed in your hands-on material.
 */
 
/*   
    this.after('UPDATE', Incidents, async incident => {
      if (incident.status_code === 'C') {
        let [ customer, recipients ] = await Promise.all ([
          getCustomerDataFor(incident),
          getResponsibleSupportersFor(incident)
        ])
        await alert.notify ('IncidentResolved', {
          recipients: recipients, // for demo purposes, we will deliver the notificaiton to ourself
          data: {
            customer: customer.info,
            title: incident.title,
            user: cds.context.user.id,
          },
          ...getNavigationPropertiesFor(incident)
        })
      }
    })
 */

/**
 * ------------------
 * Code below this line was already added for your convenience, you can check it out if you are interested.
 * It is not key for the business functionality but rather utility functions to simplify the coding above.
 * ------------------
 */

    /**
     * This is a helper method to collect the required customer data to be used in the notification we send.
     */
    const { Customers } = this.entities
    const getCustomerDataFor = async incident => {
      let customer = await SELECT.from (Customers, incident.customer_ID, c => {
        c.firstName, c.lastName, c.email
      })
      customer.info = `${customer.firstName} ${customer.lastName} (${customer.email})`
      return customer
    }

    /**
     * For demo purposes we are setting ourselves as responsibles in order to receive the notifications on our own devices.
     */
    const getResponsibleSupportersFor = () => [ cds.context.user.id ]

    /**
     * The navigation properties reference to the semanticObject & action of our deployed app in SAP Build Work Zone
     * using Intent Based Navigation. With this we can navigate to the web app from the notification.
     * With the shown TargetParameters, we can realize a deep-link into the specific incident object in question referencing its id.
     */
    const getNavigationPropertiesFor = incident => ({
      NavigationTargetObject: "ca260###",
      NavigationTargetAction: "displayIncidents",
      TargetParameters: [
        {
          "Key": "sap-ushell-innerAppRoute",
          "Value": `Incidents(ID=${incident.ID},IsActiveEntity=true)`
        }
      ]
    })

/**
 * ------------------
 * Code below this line is not related to the notification functionality as part of the hands-on but rather general coding for the "Incident" scenario.
 * ------------------
 */

    this.before("UPDATE", "Incidents", (req) => this.onUpdate(req));
    this.before("CREATE", "Incidents", (req) => this.changeUrgencyDueToSubject(req.data));

    return super.init();
  }

  changeUrgencyDueToSubject(data) {
    if (data) {
      const incidents = Array.isArray(data) ? data : [data];
      incidents.forEach((incident) => {
        if (incident.title?.toLowerCase().includes("urgent")) {
          incident.urgency = { code: "H", descr: "High" };
        }
      });
    }
  }

  /** Custom Validation */
  async onUpdate (req) {
    const { status_code } = await SELECT.one(req.subject, i => i.status_code).where({ID: req.data.ID})
    if (status_code === 'C')
      return req.reject(`Can't modify a closed incident`)
  }
}
module.exports = { ProcessorService }