const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Organization = require("../src/models/OrganizationModels");

const baseOrg = (overrides = {}) => ({
  name: "BSIT 3B",
  acronym: "BSIT3B",
  college: "College of Information Technology",
  organizationType: "class",
  parentOrganization: new mongoose.Types.ObjectId(),
  president: "Dela Cruz",
  email: "bsit3b@marsu.edu.ph",
  ...overrides,
});

test("a class with a parent organization passes validation", async () => {
  await new Organization(baseOrg()).validate();
});

test("a class without a parent organization is rejected", async () => {
  const doc = new Organization(baseOrg({ parentOrganization: null }));

  await assert.rejects(doc.validate(), (error) => {
    assert.ok(error.errors.parentOrganization);
    return true;
  });
});

test("a parent organization cannot carry a parent reference", async () => {
  const doc = new Organization(
    baseOrg({
      organizationType: "parent",
      parentOrganization: new mongoose.Types.ObjectId(),
    }),
  );

  await assert.rejects(doc.validate(), (error) => {
    assert.ok(error.errors.parentOrganization);
    return true;
  });
});

test("an organization cannot be its own parent", async () => {
  const id = new mongoose.Types.ObjectId();
  const doc = new Organization(
    baseOrg({ _id: id, parentOrganization: id }),
  );

  await assert.rejects(doc.validate(), (error) => {
    assert.ok(error.errors.parentOrganization);
    return true;
  });
});

test("a suborganization with a parent still validates", async () => {
  await new Organization(
    baseOrg({ name: "Debate Circle", acronym: "DEBATE", organizationType: "suborganization" }),
  ).validate();
});
