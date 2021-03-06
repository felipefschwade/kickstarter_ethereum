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

    it('should require a minium contribuition', async() => {
        try {
            await campaing.methods.contribute().send({from: accounts[1], value: '99'});
            assert.fail('Falhou');
        } catch (error) {
            assert.notEqual(error.message, 'Falhou');
            assert(error);
        }
    });

    it('should allow the manager to make a payment request', async () => {
        await campaing.methods.createRequest(
            'Buy batteries',
            '100',
            accounts[1]
        )
        .send({from: accounts[0], gas: '1000000'});
        const request = await campaing.methods.requests(0).call();
        assert.equal('Buy batteries', request.description);
        assert.equal('100', request.value);
        assert.equal(accounts[1], request.recipient);
    });

    it('should process a request', async () => {
        await campaing.methods.contribute().send({from: accounts[0], value: web3.utils.toWei('10', 'ether')});
        await campaing.methods.createRequest(
            'Buy batteries',
            web3.utils.toWei('5', 'ether'),
            accounts[1]
        ).send({from: accounts[0], gas: '1000000'});

        await campaing.methods.approveRequest(0).send({from: accounts[0], gas: '1000000'});
        await campaing.methods.finalizeRequest(0).send({from: accounts[0], gas: '1000000'});

        let balance = await web3.eth.getBalance(accounts[1]);
        balance = web3.utils.fromWei(balance, 'ether');
        balance = parseFloat(balance);
        assert(balance > 104);
    });

    it('should\'t process a request not send by the manager', async () => {
        await campaing.methods.contribute().send({from: accounts[0], value: web3.utils.toWei('10', 'ether')});
        await campaing.methods.createRequest(
            'Buy batteries',
            web3.utils.toWei('5', 'ether'),
            accounts[1]
        ).send({from: accounts[0], gas: '1000000'});

        await campaing.methods.approveRequest(0).send({from: accounts[0], gas: '1000000'});
        try {
            await campaing.methods.finalizeRequest(0).send({from: accounts[1], gas: '1000000'});
            assert.fail('Falhou');
        } catch (error) {
            assert.notEqual(error.message, 'Falhou');
            assert(error);
        }
    });

    it('should allow only the manager to create a request', async () => {
        await campaing.methods.contribute().send({from: accounts[0], value: web3.utils.toWei('10', 'ether')});
        try {
            await campaing.methods.createRequest(
                'Buy batteries',
                web3.utils.toWei('5', 'ether'),
                accounts[1]
            ).send({from: accounts[1], gas: '1000000'});
            assert.fail('Falhou');
        } catch (error) {
            assert.notEqual(error.message, 'Falhou');
            assert(error);
        }
    });

    it('should\'t allow to finalize a request not approved.', async () => {
        await campaing.methods.contribute().send({from: accounts[0], value: web3.utils.toWei('10', 'ether')});
        await campaing.methods.createRequest(
            'Buy batteries',
            web3.utils.toWei('5', 'ether'),
            accounts[1]
        ).send({from: accounts[0], gas: '1000000'});
        try {
            await campaing.methods.finalizeRequest(0).send({from: accounts[1], gas: '1000000'});
            assert.fail('Falhou');
        } catch (error) {
            assert.notEqual(error.message, 'Falhou');
            assert(error);
        }
    });

    it('should\'t approve a inexistent request', async () => {
        await campaing.methods.contribute().send({from: accounts[0], value: web3.utils.toWei('10', 'ether')});
        try {
            await campaing.methods.approveRequest(0).send({from: accounts[0], gas: '1000000'});
            assert.fail('Falhou');
        } catch (error) {
            assert.notEqual(error.message, 'Falhou');
            assert(error);
        }
    });
})