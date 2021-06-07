import React, { useState } from "react";
import { ApiHelper, InputBox, FundInterface, ErrorMessages } from ".";

interface Props { fund: FundInterface, updatedFunction: () => void }
export const FundEdit: React.FC<Props> = (props) => {
  const [fund, setFund] = useState<FundInterface>({ id: "", name: "" });
  const [errors, setErrors] = useState<string[]>([]);

  const handleCancel = () => props.updatedFunction();
  const handleSave = () => {
    let errors: string[] = [];

    if (!fund.name.trim()) errors.push("Enter a fund name");

    if (errors.length > 0) {
      setErrors(errors);
      setFund({ ...fund, name: "" });
      return;
    }

    setFund({ ...fund, name: fund.name.trim() });
    ApiHelper.post("/funds", [fund], "GivingApi").then(() => props.updatedFunction());
  }
  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to permanently delete this fund?")) {
      ApiHelper.delete("/funds/" + fund.id, "GivingApi").then(() => props.updatedFunction());
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let f = { ...fund };
    f.name = e.target.value;
    setFund(f);
  }

  React.useEffect(() => { setFund(props.fund); }, [props.fund]);

  return (
    <InputBox id="fundsBox" headerIcon="fas fa-hand-holding-usd" headerText="Edit Fund" cancelFunction={handleCancel} saveFunction={handleSave} deleteFunction={(fund.id === "") ? undefined : handleDelete}>
      <ErrorMessages errors={errors} />
      <div className="form-group">
        <label>Name</label>
        <input name="fundName" type="text" data-cy="fund-name" className="form-control" value={fund.name} onChange={handleChange} onKeyDown={handleKeyDown} />
      </div>
    </InputBox>

  );
}

