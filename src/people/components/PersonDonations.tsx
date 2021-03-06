import React from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { DisplayBox, ApiHelper, DateHelper, DonationInterface, UniqueIdHelper, Loading, PersonDonationForm, StripePaymentMethod, PersonInterface, CurrencyHelper, PersonRecurringDonations } from ".";
import { Link } from "react-router-dom"
import { Table } from "react-bootstrap";
import { PersonPaymentMethods } from "./PersonPaymentMethods";

interface Props { personId: string }

export const PersonDonations: React.FC<Props> = (props) => {
  const [donations, setDonations] = React.useState<DonationInterface[]>(null);
  const [stripePromise, setStripe] = React.useState<Promise<Stripe>>(null);
  const [paymentMethods, setPaymentMethods] = React.useState<StripePaymentMethod[]>(null);
  const [customerId, setCustomerId] = React.useState(null);
  const [person, setPerson] = React.useState<PersonInterface>(null);

  const loadData = () => {
    if (!UniqueIdHelper.isMissing(props.personId)) {
      ApiHelper.get("/donations?personId=" + props.personId, "GivingApi").then(data => setDonations(data));
      ApiHelper.get("/gateways", "GivingApi").then(data => {
        if (data.length && data[0]?.publicKey) {
          setStripe(loadStripe(data[0].publicKey));
          ApiHelper.get("/paymentmethods/personid/" + props.personId, "GivingApi").then(results => {
            if (!results.length) setPaymentMethods([]);
            else {
              let cards = results[0].cards.data.map((card: any) => new StripePaymentMethod(card));
              let banks = results[0].banks.data.map((bank: any) => new StripePaymentMethod(bank));
              let methods = cards.concat(banks);
              setCustomerId(results[0].customer.id);
              setPaymentMethods(methods);
            }
          });
          ApiHelper.get("/people/" + props.personId, "MembershipApi").then(data => { setPerson(data) });
        }
        else setPaymentMethods([]);
      });
    }
  }

  const handleDataUpdate = () => {
    setPaymentMethods(null);
    loadData();
  }

  const getRows = () => {
    let rows: JSX.Element[] = [];

    if (donations.length === 0) {
      rows.push(<tr key="0"><td>Donations will appear once a donation has been entered.</td></tr>);
      return rows;
    }

    for (let i = 0; i < donations.length; i++) {
      let d = donations[i];
      rows.push(
        <tr key={i}>
          <td><Link to={"/donations/" + d.batchId}>{d.batchId}</Link></td>
          <td>{DateHelper.formatHtml5Date(d.donationDate)}</td>
          <td>{d.method}</td>
          <td>{d.fund.name}</td>
          <td>{CurrencyHelper.formatCurrency(d.amount)}</td>
        </tr>
      );
    }
    return rows;
  }

  const getTableHeader = () => {
    const rows: JSX.Element[] = []

    if (donations.length > 0) {
      rows.push(<tr key="header"><th>Batch</th><th>Date</th><th>Method</th><th>Fund</th><th>Amount</th></tr>);
    }

    return rows;
  }

  React.useEffect(loadData, []);

  const getTable = () => {
    if (!donations) return <Loading />;
    else return (<Table>
      <thead>{getTableHeader()}</thead>
      <tbody>{getRows()}</tbody>
    </Table>);
  }

  const getPaymentMethodComponents = () => {
    if (!paymentMethods) return <Loading />;
    if (paymentMethods.length) return (
      <>
        <PersonPaymentMethods person={person} customerId={customerId} paymentMethods={paymentMethods} stripePromise={stripePromise} dataUpdate={handleDataUpdate} />
        <PersonRecurringDonations customerId={customerId} paymentMethods={paymentMethods}></PersonRecurringDonations>
        <PersonDonationForm person={person} customerId={customerId} paymentMethods={paymentMethods} stripePromise={stripePromise} donationSuccess={handleDataUpdate} />
      </>
    );
    return <PersonPaymentMethods person={person} customerId={customerId} paymentMethods={paymentMethods} stripePromise={stripePromise} dataUpdate={handleDataUpdate} />;
  }

  return (
    <>
      {getPaymentMethodComponents()}
      <DisplayBox headerIcon="fas fa-hand-holding-usd" headerText="Donations">
        {getTable()}
      </DisplayBox>
    </>
  );
}
