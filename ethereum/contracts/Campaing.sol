pragma solidity ^0.4.19;

contract CampaingFactory {
    address[] deployedCampaings;
    
    function createCampaing(uint minimunContrib) public {
        address newCampaing = new Campaing(minimunContrib, msg.sender);
        deployedCampaings.push(newCampaing);
    }
    
    function getDeployedCampaings() public view returns (address[]) {
        return deployedCampaings;
    }
}

contract Campaing {
    struct Request {
        string description;
        uint value;
        address recipient;
        uint approvalCount;
        mapping(address => bool) approvals;
        bool complete;
    }
    mapping(address => bool) public approvers;
    Request[] public requests;
    address public manager;
    uint public minContrib;
    uint public approversCount;
    
    modifier restricted() {
        require(msg.sender == manager);
        _;
    } 
    
    function Campaing(uint minimun, address _manager) {
        manager = _manager;
        minContrib = minimun;
    }
    
    function contribute() public payable {
        require(!approvers[msg.sender]);
        require(msg.value >= minContrib);
        approvers[msg.sender] = true;
        approversCount++;
    }
 
    function createRequest(string _description, uint _value, address _recipient) public restricted {
        Request memory newRequest = Request ({
            description: _description,
            value: _value,
            recipient: _recipient,
            complete: false,
            approvalCount: 0
        });
        requests.push(newRequest);
    }
    
    function approveRequest(uint index) public {
        Request storage request = requests[index];
        require(approvers[msg.sender]);
        require(!request.approvals[msg.sender]);
        request.approvals[msg.sender] = true;
        request.approvalCount++;
    } 
    
    function finalizeRequest(uint index) public restricted {
        Request storage request = requests[index];
        require(!request.complete);
        require(request.approvalCount > approversCount / 2);
        request.recipient.transfer(request.value);
        request.complete = true;
    }
}