import web3 from './web3';
import CampaingFactory from './build/CampaingFactory.json';

const instance = new web3.eth.Contract(JSON.parse(CampaingFactory.interface), process.env.ADDRESS);

export default instance;