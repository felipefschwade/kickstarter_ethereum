const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const compiledFactory = require('../ethereum/build/CampaingFactory.json');
const compiledCampaing = require('../ethereum/build/Campaing.json');

const web3 = new Web3(ganache.provider());

let accounts, factory, campaingAdress, campaing;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({
            data: compiledFactory.bytecode
        })
        .send({
            from: accounts[0],
            gas: '1000000'
        });
    await factory.methods.createCampaing('100').send({
        from: accounts[0],
        gas: '1000000'
    });
    
    [campaingAdress] = await factory.methods.getDeployedCampaings().call();
    campaing = await new web3.eth.Contract(JSON.parse(compiledCampaing.interface), campaingAdress);
})

describe('Campaings Test', () => {
    it('should deploy a factory and a campaing', async () => {
        assert.ok(factory.options.address);
        assert.ok(campaing.options.address);
    });

    it('should have the right manager', async () => {
        const manager = await campaing.methods.manager().call();
        assert.equal(accounts[0], manager);
    });

    it('should accept an contribution, marking the sender as an approver', async () => {
        await campaing.methods.contribute().send({from: accounts[1], value: '150'});
        await campaing.methods.contribute().send({from: accounts[2], value: '150'});
        const isApproverAccount1 = await campaing.methods.approvers(accounts[1]).call();
        const isApproverAccount2 = await campaing.methods.approvers(accounts[2]).call();
        assert.ok(isApproverAccount1);
        assert.ok(isApproverAccount2);
    });
})