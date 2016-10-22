<?php
namespace app\admin\model;

use think\Db;
use think\Loader;
use think\Model;
use think\Session;
use think\Config;

class User extends Model
{
	protected $table = 'users';

	/**
	 *  用户登录
	 */
	public function login(array $data)
	{
		$password = md5($data['password']);
		$map['username'] = $data['username'];
 
		$userRow = Db::table('users')
					->where($map)
					->find();
					
		if( empty($userRow) || $userRow['status'] == 0 || $userRow['password'] != $password ){
			if(empty($userRow)){
				$this->error = '该手机号未注册！';
			}elseif($userRow['status'] == 0){
				$this->error = '该用户已被禁用，请联系管理员！';
			}elseif($userRow['password'] != $password){
				$this->error = '密码错误！';
			}

			//登录失败要记录在日志里
	    	// Loader::model('BackstageLog')->record(" 登录失败, username:[{$data['username']}] password:$password ");
	    	return false;
		}

        unset($userRow['password']);
        Session::set(Config::get('USER_AUTH_KEY'), $userRow);

        //登录成功要记录在日志里
        // Loader::model('BackstageLog')->record('登录');
		return $userRow;	
	}

	public function index()
	{

		$data = Db::table('users')
					->where('')
					->select();

		$total = count($data);

		$data = array('rows' => $data,'total' => $total);
		return $data;
	}

}